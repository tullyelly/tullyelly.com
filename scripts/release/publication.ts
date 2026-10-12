import { GitHubApiError } from "./app";

// Includes existing pre-push lint/type/coverage hooks, then transport. Never bypass hooks.
export const PUBLICATION_TIMEOUT_MS = 10 * 60 * 1000;
export type SafeFailure = {
  category:
    | "api"
    | "timeout"
    | "signal"
    | "exit"
    | "buffer"
    | "process"
    | "validation";
  apiCategory?: GitHubApiError["classification"];
  httpStatus?: number;
  exitCode?: number;
  signal?: string;
  processCode?: string;
  networkCauseCodes?: string[];
  lastPhase?:
    | "git-push"
    | "hook-lint"
    | "hook-typecheck"
    | "hook-smoke"
    | "hook-coverage"
    | "hook-complete";
  hookExitCode?: number;
  evidence?: (
    | "local-hook-failed"
    | "validation-failed"
    | "authentication-failed"
    | "remote-rejected"
    | "network-transport-failed"
  )[];
};
export function safeFailure(error: unknown): SafeFailure {
  if (error instanceof PublicationProcessError) return error.failure;
  if (error instanceof GitHubApiError)
    return {
      category: "api",
      apiCategory: error.classification,
      httpStatus: error.status,
      ...(error.networkCauseCodes.length
        ? { networkCauseCodes: error.networkCauseCodes }
        : {}),
    };
  if (typeof error !== "object" || error === null)
    return { category: "validation" };
  const value = error as Record<string, unknown>;
  const processCode = [
    "ETIMEDOUT",
    "ENOBUFS",
    "ENOENT",
    "EACCES",
    "EPERM",
  ].find((code) => value.code === code);
  const signal = ["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP"].find(
    (code) => value.signal === code,
  );
  const exitCode =
    typeof value.status === "number" &&
    Number.isInteger(value.status) &&
    value.status >= 0 &&
    value.status <= 255
      ? value.status
      : undefined;
  return {
    category:
      processCode === "ETIMEDOUT"
        ? "timeout"
        : processCode === "ENOBUFS"
          ? "buffer"
          : signal
            ? "signal"
            : exitCode !== undefined
              ? "exit"
              : processCode
                ? "process"
                : "validation",
    ...(processCode ? { processCode } : {}),
    ...(signal ? { signal } : {}),
    ...(exitCode !== undefined ? { exitCode } : {}),
  };
}
/** No output is forwarded. Exact markers produce fixed, evidence-only classifications. */
export class PublicationProcessError extends Error {
  readonly failure: SafeFailure;
  constructor(error: unknown) {
    super("Git publication subprocess failed; output omitted");
    this.name = "PublicationProcessError";
    const failure = safeFailure(error);
    let lastPhase: NonNullable<SafeFailure["lastPhase"]> = "git-push";
    const evidence = new Set<NonNullable<SafeFailure["evidence"]>[number]>();
    let hookExitCode: number | undefined;
    if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      const text = (v: unknown) =>
        (typeof v === "string"
          ? v
          : Buffer.isBuffer(v)
            ? v.toString("utf8")
            : ""
        ).replace(/\x1b\[[0-9;]*m/g, "");
      // execFileSync already caps each captured stream at the unchanged 8 MiB limit.
      const stdout = text(e.stdout),
        stderr = text(e.stderr);
      const phases: Record<string, NonNullable<SafeFailure["lastPhase"]>> = {
        "🧹 Linting…": "hook-lint",
        "🔎 Type checking…": "hook-typecheck",
        "🧪 Smoke tests (related only)…": "hook-smoke",
        "🛡️ Full coverage suite…": "hook-coverage",
        "✅ Test suites passed.": "hook-complete",
      };
      for (const line of stdout.split(/\r?\n/))
        if (phases[line.trim()]) lastPhase = phases[line.trim()];
      const combined = stdout + "\n" + stderr;
      const hook = /^husky - pre-push script failed \(code (\d{1,3})\)$/m.exec(
        combined,
      );
      if (hook && Number(hook[1]) <= 255) {
        hookExitCode = Number(hook[1]);
        evidence.add("local-hook-failed");
      }
      if (
        /^(?:FAIL\s|Test Suites:.*\bfailed\b)|\berror TS\d{4}:|^Jest:.*coverage threshold/m.test(
          combined,
        )
      )
        evidence.add("validation-failed");
      if (
        /^fatal: Authentication failed|^remote: Invalid username or (?:password|token)|^fatal: could not read (?:Username|Password)/m.test(
          combined,
        )
      )
        evidence.add("authentication-failed");
      if (/\[remote rejected\]|^remote: error: GH(?:006|013):/m.test(combined))
        evidence.add("remote-rejected");
      if (
        /^fatal: unable to access .*?(?:Could not resolve host|Failed to connect|Connection reset|SSL certificate problem|Operation timed out)|^error: RPC failed; curl \d+/m.test(
          combined,
        )
      )
        evidence.add("network-transport-failed");
    }
    this.failure = {
      ...failure,
      lastPhase,
      ...(hookExitCode === undefined ? {} : { hookExitCode }),
      ...(evidence.size ? { evidence: [...evidence] } : {}),
    };
  }
}
export type PublicationDiagnostic = {
  stage: "preflight" | "push" | "remote-verification";
  outcome: "passed" | "failed";
  elapsedMs: number;
  failure?: SafeFailure;
};
export type PublicationReport = {
  publication: "confirmed" | "not-published" | "unknown";
  push: "not-attempted" | "succeeded" | "failed";
  verification:
    | "not-attempted"
    | "matched"
    | "mismatched"
    | "absent"
    | "unavailable";
  remoteSha?: string;
};
export async function publishExactCommit(
  sha: string,
  dependencies: {
    preflight: () => Promise<void>;
    push: () => Promise<void>;
    readRemote: () => Promise<string | undefined>;
    diagnostic: (event: PublicationDiagnostic) => void;
    now?: () => number;
  },
): Promise<PublicationReport> {
  if (!/^[a-f0-9]{40}$/.test(sha))
    throw new Error("Exact publication SHA required");
  const now = dependencies.now ?? Date.now;
  const run = async (
    stage: PublicationDiagnostic["stage"],
    operation: () => Promise<unknown>,
  ) => {
    const started = now();
    try {
      const result = await operation();
      dependencies.diagnostic({
        stage,
        outcome: "passed",
        elapsedMs: Math.max(0, now() - started),
      });
      return result;
    } catch (error) {
      dependencies.diagnostic({
        stage,
        outcome: "failed",
        elapsedMs: Math.max(0, now() - started),
        failure: safeFailure(error),
      });
      throw error;
    }
  };
  try {
    await run("preflight", dependencies.preflight);
  } catch {
    return {
      publication: "not-published",
      push: "not-attempted",
      verification: "not-attempted",
    };
  }
  let push: PublicationReport["push"] = "succeeded";
  try {
    await run("push", dependencies.push);
  } catch {
    push = "failed";
  }
  // One attempt only. Inspect even after local errors: a remote write may already have succeeded.
  try {
    const remote = (await run("remote-verification", async () => {
      const value = await dependencies.readRemote();
      if (value !== undefined && !/^[a-f0-9]{40}$/.test(value))
        throw new Error("Invalid remote SHA");
      return value;
    })) as string | undefined;
    return {
      publication: remote === sha ? "confirmed" : "not-published",
      push,
      verification:
        remote === sha
          ? "matched"
          : remote === undefined
            ? "absent"
            : "mismatched",
      ...(remote ? { remoteSha: remote } : {}),
    };
  } catch {
    return { publication: "unknown", push, verification: "unavailable" };
  }
}
export function publicationExitCode(
  report: PublicationReport | undefined,
  cleanup: "revoked" | "failed" | "not-attempted",
) {
  return report?.publication === "confirmed" && cleanup === "revoked" ? 0 : 1;
}
