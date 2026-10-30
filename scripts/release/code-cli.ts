import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CodeDiagnosticError, type Guard } from "./code-diagnostics";
import { providerDiagnostic } from "./provider-diagnostic.mjs";

type CliOperation = Extract<
  Guard,
  "vercel.stage" | "vercel.promote" | "vercel.rollback" | "vercel.auth-cli"
>;
const spawnCodes = new Set([
  "ENOENT",
  "EACCES",
  "EPERM",
  "EINVAL",
  "ETIMEDOUT",
  "ENOBUFS",
  "E2BIG",
]);
const signals = new Set([
  "SIGTERM",
  "SIGKILL",
  "SIGINT",
  "SIGABRT",
  "SIGSEGV",
  "SIGBUS",
]);

export function nativeSourceDeployArguments(binding: {
  projectId: string;
  commit: string;
  evidenceDigest: string;
  sourceDigest: string;
  workflowRunId: string;
  workflowRunAttempt: string;
  collectionEnabled: boolean;
}) {
  return [
    "deploy",
    "--prod",
    "--skip-domain",
    "--yes",
    "--no-wait",
    "--project",
    binding.projectId,
    "--meta",
    `releaseSha=${binding.commit}`,
    "--meta",
    `githubCommitSha=${binding.commit}`,
    "--meta",
    `releaseEvidence=${binding.evidenceDigest}`,
    "--meta",
    `releaseSourceSha256=${binding.sourceDigest}`,
    "--meta",
    `releaseRunId=${binding.workflowRunId}`,
    "--meta",
    `releaseRunAttempt=${binding.workflowRunAttempt}`,
    "--meta",
    `analyticsCollectionEnabled=${binding.collectionEnabled}`,
    "--env",
    `ANALYTICS_SYNC_ENABLED=${binding.collectionEnabled}`,
  ];
}

/** Retain fixed provider labels and process structure, never raw output. */
export function codeCli(
  operation: CliOperation,
  args: string[],
  teamId: string,
  token: string,
  run: typeof spawnSync = spawnSync,
  options: { cwd?: string } = {},
) {
  // Fresh state prevents a saved owner session or cached scope from supplying
  // authority that the explicitly supplied protected credential does not have.
  const isolation = mkdtempSync(join(tmpdir(), "release-cli-state-"));
  const home = join(isolation, "home"),
    config = join(isolation, "config");
  mkdirSync(home);
  mkdirSync(config);
  try {
    const result = run(
      "vercel",
      [
        ...args,
        "--non-interactive",
        "--scope",
        teamId,
        "--global-config",
        config,
      ],
      {
        encoding: "utf8",
        timeout: 900000,
        maxBuffer: 1024 * 1024,
        cwd: options.cwd,
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH,
          HOME: home,
          XDG_CONFIG_HOME: config,
          XDG_CACHE_HOME: join(isolation, "cache"),
          XDG_DATA_HOME: join(isolation, "data"),
          CI: "true",
          NO_UPDATE_NOTIFIER: "1",
          VERCEL_TOKEN: token,
          VERCEL_TELEMETRY_DISABLED: "1",
        },
      },
    );
    if (result.status !== 0 || result.error) {
      const code =
        result.error && "code" in result.error ? result.error.code : undefined;
      throw new CodeDiagnosticError({
        guard: operation,
        operation,
        category: "process",
        invariant: "code.provider-operation-unresolved",
        exitStatus: result.status,
        signal:
          result.signal && signals.has(result.signal) ? result.signal : null,
        spawnErrorCode:
          typeof code === "string" && spawnCodes.has(code) ? code : undefined,
        processCategory: result.error
          ? "spawn"
          : result.signal
            ? "signal"
            : "exit",
        provider: providerDiagnostic(result.stdout, result.stderr, {
          secrets: [
            token,
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
            process.env.GH_TOKEN,
            process.env.GITHUB_TOKEN,
          ].filter((value): value is string => Boolean(value)),
        }),
      });
    }
    return result.stdout.trim();
  } finally {
    rmSync(isolation, { recursive: true, force: true });
  }
}

export function stagedDeploymentUrl(output: string) {
  try {
    // CLI 63.1.2 uses structured output with --non-interactive. Select only
    // the deployment URL; messages, production URLs and suggested commands
    // must never supply a target. Identity is independently checked via API.
    let origin: unknown = output;
    if (output.startsWith("{")) {
      const result: unknown = JSON.parse(output);
      if (
        !result ||
        typeof result !== "object" ||
        !("status" in result) ||
        result.status !== "ok" ||
        !("deployment" in result) ||
        !result.deployment ||
        typeof result.deployment !== "object" ||
        !("url" in result.deployment)
      )
        throw new Error();
      origin = result.deployment.url;
    }
    if (typeof origin !== "string") throw new Error();
    const url = new URL(origin);
    if (
      url.protocol === "https:" &&
      /^[a-z0-9-]+\.vercel\.app$/.test(url.hostname) &&
      url.origin === origin
    )
      return url;
  } catch {
    /* Never include untrusted output in an exception. */
  }
  throw new Error("code.stage-output-unresolved");
}
