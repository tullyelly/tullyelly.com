/** @jest-environment node */
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import {
  assertCodeRevision,
  artifactBinding,
  artifactCommand,
  archiveDigest,
  packageCodeArtifact,
  restoreCodeArtifact,
  verifyBuildContext,
  buildFailure,
} from "../../scripts/release/code-artifact";
import {
  type CodeManifest,
  PRODUCTION_DATABASE_HOST,
} from "../../scripts/release/code-manifest";
import { settingsDigest } from "../../scripts/release/manifest";
import { classifyCodeFailure } from "../../scripts/release/code-diagnostics";

const settings = {
  framework: "nextjs" as const,
  nodeVersion: "22.x" as const,
  buildCommand: null,
  installCommand: null,
  rootDirectory: null,
  outputDirectory: null,
};
const m: CodeManifest = {
  version: 2,
  kind: "code-only",
  operation: "deploy",
  collectionEnabled: false,
  commit: "a".repeat(40),
  buildEnvironment: { NEXT_PUBLIC_SITE_URL: "https://tullyelly.com" },
  vercel: {
    productionDeploymentId: "dpl_previous",
    productionHost: "tullyelly.com",
    projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
    teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
    settings,
    settingsSha256: settingsDigest(settings),
  },
  schemaCompatibility: {
    checkedAt: new Date().toISOString(),
    checkedBy: "tullyelly",
    evidenceUrl: "https://github.com/tullyelly/tullyelly.com/issues/1",
    previousApplicationSha: "e".repeat(40),
    databaseHost: PRODUCTION_DATABASE_HOST,
    database: "tullyelly_db",
    method: "unchanged-database-contract",
    requiredObjects: [],
    missingObjects: [],
    compatible: true,
    rollbackCompatible: true,
  },
};
const binding = () => artifactBinding(m, "b".repeat(64), "123", "1");
const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "canonical-artifact-"));
  roots.push(root);
  const source = join(root, "source"),
    temporary = join(root, "temporary"),
    target = join(root, "target");
  for (const directory of [
    join(source, ".vercel/output"),
    temporary,
    join(target, ".vercel"),
  ])
    mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(source, ".vercel/output/config.json"),
    JSON.stringify({ version: 3 }),
  );
  writeFileSync(
    join(source, ".vercel/project.json"),
    JSON.stringify({
      orgId: m.vercel.teamId,
      projectId: m.vercel.projectId,
      settings,
    }),
  );
  writeFileSync(join(source, ".vercel/.env.production.local"), "");
  return { source, temporary, target };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

test("exact revision rejects changed tracked or untracked source while allowing ignored build metadata", () => {
  const root = mkdtempSync(join(tmpdir(), "canonical-revision-"));
  roots.push(root);
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git(["init", "-q"]);
  writeFileSync(join(root, "app.ts"), "export const reviewed = true;\n");
  writeFileSync(join(root, ".gitignore"), "generated.json\n");
  git(["add", "."]);
  git([
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "-qm",
    "fixture",
  ]);
  const revision = git(["rev-parse", "HEAD"]).trim();
  expect(() => assertCodeRevision(revision, root)).not.toThrow();
  expect(() => assertCodeRevision("0".repeat(40), root)).toThrow(
    "code.application-sha",
  );
  writeFileSync(join(root, "generated.json"), "{}");
  expect(() => assertCodeRevision(revision, root)).not.toThrow();
  writeFileSync(join(root, "app.ts"), "export const reviewed = false;\n");
  expect(() => assertCodeRevision(revision, root)).toThrow(
    "code.application-worktree",
  );
  writeFileSync(join(root, "app.ts"), "export const reviewed = true;\n");
  writeFileSync(join(root, "extra.ts"), "export const unreviewed = true;\n");
  expect(() => assertCodeRevision(revision, root)).toThrow(
    "code.application-worktree",
  );
});

test("canonical packaging binds one archive, preserves bytes and restores without source or dependencies", async () => {
  const { source, temporary, target } = fixture();
  const result = await packageCodeArtifact(binding(), temporary, source);
  const archive = join(temporary, "approved-prebuilt.tar");
  const bytes = readFileSync(archive);
  expect(result).toEqual({
    sha256: await archiveDigest(archive),
    sizeBytes: bytes.length,
  });
  await expect(
    packageCodeArtifact(binding(), temporary, source),
  ).rejects.toThrow("code.artifact-already-created");
  expect(readFileSync(archive)).toEqual(bytes);
  rmSync(source, { recursive: true });
  await restoreCodeArtifact(binding(), result.sha256, temporary, target);
  expect(
    JSON.parse(
      readFileSync(join(target, ".vercel/output/.release-build.json"), "utf8"),
    ),
  ).toEqual(binding());
  expect(existsSync(join(target, "node_modules"))).toBe(false);
  expect(readFileSync(archive)).toEqual(bytes);
});

test.each([
  { target: "preview" },
  { applicationSha: "c".repeat(40) },
  { manifestSha256: "c".repeat(64) },
  { settingsSha256: "c".repeat(64) },
  { publicEnvironmentSha256: "c".repeat(64) },
  { projectId: "prj_other" },
  { teamId: "team_other" },
  { runId: "124" },
  { attempt: "2" },
  { cliVersion: "0.0.1" },
])(
  "restore rejects differently configured production evidence %j",
  async (change) => {
    const { source, temporary, target } = fixture();
    const result = await packageCodeArtifact(binding(), temporary, source);
    await expect(
      restoreCodeArtifact(
        { ...binding(), ...change },
        result.sha256,
        temporary,
        target,
      ),
    ).rejects.toMatchObject({
      diagnostic: {
        guard: "artifact.validation",
        invariant: "code.artifact-binding",
      },
    });
    expect(existsSync(join(target, ".vercel/output"))).toBe(false);
  },
);

test("archive tampering fails before extraction and never installs output", async () => {
  const { source, temporary, target } = fixture();
  const result = await packageCodeArtifact(binding(), temporary, source);
  writeFileSync(
    join(temporary, "approved-prebuilt.tar"),
    "SENSITIVE_BYTES_DO_NOT_LOG",
  );
  await expect(
    restoreCodeArtifact(binding(), result.sha256, temporary, target),
  ).rejects.toMatchObject({
    diagnostic: { invariant: "code.artifact-digest" },
  });
  expect(existsSync(join(temporary, "approved-extract"))).toBe(false);
  expect(existsSync(join(target, ".vercel/output"))).toBe(false);
});

test("legacy output without provenance cannot be approved as current production evidence", async () => {
  const { source, temporary, target } = fixture();
  const archive = join(temporary, "approved-prebuilt.tar");
  expect(
    spawnSync("tar", ["-cf", archive, "-C", source, ".vercel/output"]).status,
  ).toBe(0);
  await expect(
    restoreCodeArtifact(
      binding(),
      await archiveDigest(archive),
      temporary,
      target,
    ),
  ).rejects.toMatchObject({
    diagnostic: { invariant: "code.artifact-binding" },
  });
});

test("deployment-only reruns consume the saved builder attempt, not the current attempt", async () => {
  const { source, temporary, target } = fixture();
  const built = await packageCodeArtifact(binding(), temporary, source);
  const rerun = join(temporary, "rerun");
  mkdirSync(rerun);
  copyFileSync(
    join(temporary, "approved-prebuilt.tar"),
    join(rerun, "approved-prebuilt.tar"),
  );
  await restoreCodeArtifact(binding(), built.sha256, rerun, target);
  expect(
    JSON.parse(
      readFileSync(join(target, ".vercel/output/.release-build.json"), "utf8"),
    ).attempt,
  ).toBe("1");
});

test("build context rejects changed project settings, loaded production env and stale output", () => {
  const { source } = fixture();
  expect(() => verifyBuildContext(m, source)).toThrow(
    "code.build-output-present",
  );
  rmSync(join(source, ".vercel/output"), { recursive: true });
  expect(() => verifyBuildContext(m, source)).not.toThrow();
  writeFileSync(
    join(source, ".vercel/.env.production.local"),
    "SENSITIVE_DO_NOT_LOG",
  );
  expect(() => verifyBuildContext(m, source)).toThrow(
    "code.build-configuration",
  );
  writeFileSync(join(source, ".vercel/.env.production.local"), "");
  writeFileSync(
    join(source, ".vercel/project.json"),
    JSON.stringify({
      orgId: m.vercel.teamId,
      projectId: m.vercel.projectId,
      settings: { ...settings, buildCommand: "different-build" },
    }),
  );
  expect(() => verifyBuildContext(m, source)).toThrow(
    "code.build-configuration",
  );
});

test("artifact and builder process diagnostics keep fixed checks and omit process payloads", () => {
  const sensitive = "SENSITIVE_DO_NOT_LOG";
  const result = {
    pid: 1,
    output: [],
    status: 7,
    signal: null,
    stdout: sensitive,
    stderr: `Code-only artifact validation failed: code.artifact-binding; values omitted\n${sensitive}`,
  };
  const runner = jest.fn(() => result);
  try {
    artifactCommand(["verify", sensitive], runner);
  } catch (error) {
    const diagnostic = classifyCodeFailure("artifact.validation", error);
    expect(diagnostic).toMatchObject({
      invariant: "code.artifact-binding",
      exitStatus: 7,
    });
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
  }
  const diagnostic = classifyCodeFailure(
    "build.production",
    buildFailure({
      ...result,
      stderr: sensitive + "\ncode.build-example-unreviewed\n",
    }),
  );
  expect(diagnostic).toMatchObject({
    category: "process",
    guard: "build.production",
    invariant: "code.build-example-unreviewed",
    exitStatus: 7,
  });
  expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
});
