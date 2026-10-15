import { spawnSync } from "node:child_process";
import { CodeDiagnosticError, type Guard } from "./code-diagnostics";
import { providerDiagnostic } from "./provider-diagnostic.mjs";

type CliOperation = Extract<
  Guard,
  "vercel.stage" | "vercel.promote" | "vercel.rollback"
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

export function prebuiltDeployArguments(binding: {
  projectId: string;
  commit: string;
  manifestDigest: string;
  buildDigest: string;
}) {
  return [
    "deploy",
    "--prebuilt",
    "--prod",
    "--skip-domain",
    "--yes",
    "--project",
    binding.projectId,
    "--meta",
    `releaseSha=${binding.commit}`,
    "--meta",
    `githubCommitSha=${binding.commit}`,
    "--meta",
    `releaseManifest=${binding.manifestDigest}`,
    "--meta",
    `releaseBuildSha256=${binding.buildDigest}`,
    "--meta",
    "collectionDisabled=true",
    "--env",
    "ANALYTICS_SYNC_ENABLED=false",
  ];
}

/** Retain fixed provider labels and process structure, never raw output. */
export function codeCli(
  operation: CliOperation,
  args: string[],
  teamId: string,
  token: string,
  run: typeof spawnSync = spawnSync,
) {
  const result = run(
    "vercel",
    [...args, "--non-interactive", "--scope", teamId],
    {
      encoding: "utf8",
      timeout: 900000,
      maxBuffer: 1024 * 1024,
      env: {
        NODE_ENV: "production",
        PATH: process.env.PATH,
        HOME: process.env.HOME,
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
      provider: providerDiagnostic(result.stdout, result.stderr),
    });
  }
  return result.stdout.trim();
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
