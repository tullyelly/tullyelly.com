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
};
export function safeFailure(error: unknown): SafeFailure {
  if (error instanceof GitHubApiError)
    return {
      category: "api",
      apiCategory: error.classification,
      httpStatus: error.status,
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
