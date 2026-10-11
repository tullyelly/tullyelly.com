/** @jest-environment node */
import { GitHubApiError } from "@/scripts/release/app";
import {
  publishExactCommit,
  publicationExitCode,
  safeFailure,
  PUBLICATION_TIMEOUT_MS,
} from "@/scripts/release/publication";

const sha = "a".repeat(40);
function fixture() {
  let time = 0;
  return {
    preflight: jest.fn(async () => undefined),
    push: jest.fn(async () => undefined),
    readRemote: jest.fn<Promise<string | undefined>, []>(async () => sha),
    diagnostic: jest.fn(),
    now: () => (time += 7),
  };
}
test("normal publication independently confirms the SHA and requires credential cleanup", async () => {
  const dependencies = fixture();
  const result = await publishExactCommit(sha, dependencies);
  expect(result).toMatchObject({
    publication: "confirmed",
    push: "succeeded",
    verification: "matched",
    remoteSha: sha,
  });
  expect(publicationExitCode(result, "revoked")).toBe(0);
  expect(publicationExitCode(result, "failed")).toBe(1);
  expect(dependencies.push).toHaveBeenCalledTimes(1);
  expect(dependencies.readRemote).toHaveBeenCalledTimes(1);
  expect(
    dependencies.diagnostic.mock.calls.map(([x]) => [x.stage, x.elapsedMs]),
  ).toEqual([
    ["preflight", 7],
    ["push", 7],
    ["remote-verification", 7],
  ]);
  expect(PUBLICATION_TIMEOUT_MS).toBeGreaterThan(60000);
  expect(PUBLICATION_TIMEOUT_MS).toBeLessThan(60 * 60 * 1000);
});
test("timeout inspects remote state exactly once and never retries the write", async () => {
  const dependencies = fixture();
  dependencies.push.mockRejectedValue(
    Object.assign(new Error("secret headers and stderr"), {
      code: "ETIMEDOUT",
      signal: "SIGTERM",
    }),
  );
  dependencies.readRemote.mockResolvedValue(undefined);
  expect(await publishExactCommit(sha, dependencies)).toMatchObject({
    publication: "not-published",
    push: "failed",
    verification: "absent",
  });
  expect(dependencies.push).toHaveBeenCalledTimes(1);
  expect(dependencies.readRemote).toHaveBeenCalledTimes(1);
  expect(dependencies.diagnostic).toHaveBeenCalledWith(
    expect.objectContaining({
      stage: "push",
      failure: {
        category: "timeout",
        processCode: "ETIMEDOUT",
        signal: "SIGTERM",
      },
    }),
  );
  expect(JSON.stringify(dependencies.diagnostic.mock.calls)).not.toMatch(
    /secret|headers|stderr/,
  );
});
test("successful remote write followed by local failure remains confirmed", async () => {
  const dependencies = fixture();
  let remote: string | undefined;
  dependencies.push.mockImplementation(async () => {
    remote = sha;
    throw Object.assign(new Error("sensitive-output"), { status: 1 });
  });
  dependencies.readRemote.mockImplementation(async () => remote);
  const result = await publishExactCommit(sha, dependencies);
  expect(result).toMatchObject({
    publication: "confirmed",
    push: "failed",
    verification: "matched",
  });
  expect(publicationExitCode(result, "revoked")).toBe(0);
  expect(dependencies.push).toHaveBeenCalledTimes(1);
});
test("wrong remote SHA rejects publication even when Git exits successfully", async () => {
  const dependencies = fixture();
  dependencies.readRemote.mockResolvedValue("b".repeat(40));
  const result = await publishExactCommit(sha, dependencies);
  expect(result).toMatchObject({
    publication: "not-published",
    verification: "mismatched",
    remoteSha: "b".repeat(40),
  });
  expect(publicationExitCode(result, "revoked")).toBe(1);
});
test.each([403, 404, 503])(
  "HTTP %s during remote verification leaves publication unknown",
  async (status) => {
    const dependencies = fixture();
    dependencies.readRemote.mockRejectedValue(
      new GitHubApiError(
        status === 503
          ? "transient"
          : status === 403
            ? "forbidden"
            : "not-found-or-not-visible",
        status,
      ),
    );
    const result = await publishExactCommit(sha, dependencies);
    expect(result).toMatchObject({
      publication: "unknown",
      push: "succeeded",
      verification: "unavailable",
    });
    expect(publicationExitCode(result, "revoked")).toBe(1);
    expect(dependencies.diagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "remote-verification",
        failure: expect.objectContaining({
          category: "api",
          httpStatus: status,
        }),
      }),
    );
    expect(dependencies.push).toHaveBeenCalledTimes(1);
  },
);
test("preflight failure prevents writes and malformed remote data cannot confirm publication", async () => {
  const dependencies = fixture();
  dependencies.preflight.mockRejectedValue(new Error("credentials"));
  expect(await publishExactCommit(sha, dependencies)).toMatchObject({
    push: "not-attempted",
    verification: "not-attempted",
  });
  expect(dependencies.push).not.toHaveBeenCalled();
  expect(dependencies.readRemote).not.toHaveBeenCalled();
  const malformed = fixture();
  malformed.readRemote.mockResolvedValue("secret-invalid-value");
  expect(await publishExactCommit(sha, malformed)).toMatchObject({
    publication: "unknown",
  });
  expect(JSON.stringify(malformed.diagnostic.mock.calls)).not.toContain(
    "secret-invalid-value",
  );
});
test("diagnostics whitelist process fields and omit arbitrary exception contents", () => {
  expect(
    safeFailure({
      status: 2,
      signal: "SIGKILL",
      code: "sensitive-value",
      stderr: "secret",
      message: "token",
    }),
  ).toEqual({ category: "signal", signal: "SIGKILL", exitCode: 2 });
  expect(safeFailure({ code: "ENOBUFS" })).toEqual({
    category: "buffer",
    processCode: "ENOBUFS",
  });
});
