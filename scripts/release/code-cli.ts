import { spawnSync } from "node:child_process";
import { CodeDiagnosticError, type Guard } from "./code-diagnostics";

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

/** Capture process structure only; never serialize stdout, stderr or error messages. */
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
    });
  }
  return result.stdout.trim();
}
