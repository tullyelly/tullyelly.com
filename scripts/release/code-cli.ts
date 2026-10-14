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
    const url = new URL(output);
    if (
      url.protocol === "https:" &&
      /^[a-z0-9-]+\.vercel\.app$/.test(url.hostname) &&
      url.origin === output
    )
      return url;
  } catch {
    /* Never include untrusted output in an exception. */
  }
  throw new Error("code.stage-output-unresolved");
}
