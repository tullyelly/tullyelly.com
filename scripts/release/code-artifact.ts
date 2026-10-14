import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  spawnSync,
  execFileSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process";
import { z } from "zod";
import { type CodeManifest } from "./code-manifest";
import { settingsDigest, sha256 } from "./manifest";
import { CodeDiagnosticError, codeGuard } from "./code-diagnostics";

const decimal = z.string().regex(/^[1-9][0-9]*$/);
export function assertCodeRevision(revision: string, root = process.cwd()) {
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  if (git(["rev-parse", "HEAD"]).trim() !== revision)
    throw new Error("code.application-sha");
  if (
    git(["diff", "--name-only", "HEAD"]).trim() ||
    git(["ls-files", "--others", "--exclude-standard"]).trim()
  )
    throw new Error("code.application-worktree");
}
export function artifactBinding(
  m: CodeManifest,
  manifestDigest: string,
  runId: string,
  attempt: string,
) {
  return {
    version: 1,
    target: "production",
    applicationSha: m.commit,
    manifestSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(manifestDigest),
    settingsSha256: m.vercel.settingsSha256,
    publicEnvironmentSha256: sha256(
      JSON.stringify(
        Object.entries(m.buildEnvironment).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
    ),
    projectId: String(m.vercel.projectId),
    teamId: String(m.vercel.teamId),
    runId: decimal.parse(runId),
    attempt: decimal.parse(attempt),
    cliVersion: "63.1.2",
  };
}
export type ArtifactBinding = ReturnType<typeof artifactBinding>;

const artifactInvariants = new Set([
  "code.artifact-config",
  "code.artifact-external-link",
  "code.artifact-env-file",
  "code.artifact-build-value",
  "code.artifact-handler",
  "code.artifact-runtime-env",
  "code.artifact-analytics-enabled",
  "code.artifact-digest-format",
  "code.artifact-digest",
  "code.artifact-arguments",
  "code.artifact-binding",
  "code.artifact-validation-failed",
  "maintenance.archive-directory-not-empty",
  "maintenance.archive-member",
  "maintenance.archive-link",
  "code.build-local-env-present",
  "code.build-example-unreviewed",
  "code.build-context-arguments",
  "code.build-context-restore-failed",
  "code.build-context-failed",
  "code.build-interrupted",
]);

export function buildFailure(result: ReturnType<typeof spawnSync>) {
  const stderr = String(result.stderr ?? "");
  const known = stderr.trim().split("\n").at(-1);
  const code =
    result.error && "code" in result.error ? result.error.code : undefined;
  return new CodeDiagnosticError({
    guard: "build.production",
    category: "process",
    invariant:
      known && artifactInvariants.has(known) ? known : "code.build-failed",
    exitStatus: result.status,
    signal: result.signal,
    spawnErrorCode: typeof code === "string" ? code : undefined,
    processCategory: result.error ? "spawn" : result.signal ? "signal" : "exit",
  });
}

/** Python emits fixed invariants; process payloads and arbitrary stderr stay private. */
export function artifactCommand(
  args: string[],
  run: (
    command: string,
    args: string[],
    options: SpawnSyncOptionsWithStringEncoding,
  ) => SpawnSyncReturns<string> = spawnSync,
) {
  const result = run("python3", ["scripts/release/code-artifact.py", ...args], {
    encoding: "utf8",
    timeout: 120000,
  });
  if (result.status !== 0 || result.error) {
    const code = result.stderr?.match(
      /validation failed: ([a-z.-]+); values omitted/,
    )?.[1];
    throw new CodeDiagnosticError({
      guard: "artifact.validation",
      category: "invariant",
      invariant:
        code && artifactInvariants.has(code)
          ? code
          : "code.artifact-validation-failed",
      exitStatus: result.status,
    });
  }
}

export async function archiveDigest(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export function verifyBuildContext(m: CodeManifest, root = process.cwd()) {
  const project = z
    .object({ orgId: z.string(), projectId: z.string(), settings: z.unknown() })
    .parse(
      JSON.parse(readFileSync(join(root, ".vercel/project.json"), "utf8")),
    );
  if (
    project.orgId !== m.vercel.teamId ||
    project.projectId !== m.vercel.projectId ||
    settingsDigest(project.settings as CodeManifest["vercel"]["settings"]) !==
      m.vercel.settingsSha256 ||
    readFileSync(join(root, ".vercel/.env.production.local")).length !== 0
  )
    throw new Error("code.build-configuration");
  if (existsSync(join(root, ".vercel/output")))
    throw new Error("code.build-output-present");
}

export async function packageCodeArtifact(
  binding: ArtifactBinding,
  temporary: string,
  root = process.cwd(),
) {
  const archive = join(temporary, "approved-prebuilt.tar");
  if (existsSync(archive)) throw new Error("code.artifact-already-created");
  const output = join(root, ".vercel/output");
  // Verify before stamping provenance; only the production builder calls this helper.
  artifactCommand(["verify", output]);
  if (existsSync(join(output, ".release-build.json")))
    throw new Error("code.artifact-binding");
  writeFileSync(join(output, ".release-build.json"), JSON.stringify(binding));
  const packed = spawnSync(
    "tar",
    ["-cf", archive, "-C", root, ".vercel/output"],
    {
      encoding: "utf8",
    },
  );
  if (packed.status !== 0 || packed.error)
    throw new Error("code.artifact-package");
  const digest = await archiveDigest(archive);
  artifactCommand([
    "extract",
    archive,
    join(temporary, "portable-check"),
    digest,
    JSON.stringify(binding),
  ]);
  return { sha256: digest, sizeBytes: statSync(archive).size };
}

export async function restoreCodeArtifact(
  binding: ArtifactBinding,
  digest: string,
  temporary: string,
  root = process.cwd(),
) {
  await codeGuard("artifact.validation", async () => {
    if (existsSync(join(root, ".vercel/output")))
      throw new Error("code.build-output-present");
    const directory = join(temporary, "approved-extract");
    artifactCommand([
      "extract",
      join(temporary, "approved-prebuilt.tar"),
      directory,
      digest,
      JSON.stringify(binding),
    ]);
    renameSync(join(directory, ".vercel/output"), join(root, ".vercel/output"));
  });
}
