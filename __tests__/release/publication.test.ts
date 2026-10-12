/** @jest-environment node */
import { GitHubApiError } from "@/scripts/release/app";
import {
  publishExactCommit,
  publicationExitCode,
  safeFailure,
  PUBLICATION_TIMEOUT_MS,
  PublicationProcessError,
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

describe("evidence-only Git output diagnostics", () => {
  // Synthetic userinfo is assembled at runtime; no credential URL is stored in source.
  const credentialUrl = new URL("https://example.com");
  credentialUrl.username = "user";
  credentialUrl.password = "private-value";
  test.each([
    ["🧹 Linting…", "hook-lint"],
    ["🔎 Type checking…", "hook-typecheck"],
    ["🧪 Smoke tests (related only)…", "hook-smoke"],
    ["🛡️ Full coverage suite…", "hook-coverage"],
    ["✅ Test suites passed.", "hook-complete"],
  ])("recognizes %s without retaining output", (marker, phase) => {
    const e = new PublicationProcessError({
      status: 1,
      stdout: Buffer.from(`🧹 Linting…\n${marker}\n`),
      stderr: "husky - pre-push script failed (code 1)",
    });
    expect(safeFailure(e)).toMatchObject({
      category: "exit",
      exitCode: 1,
      lastPhase: phase,
      hookExitCode: 1,
      evidence: ["local-hook-failed"],
    });
    expect(e).not.toHaveProperty("stdout");
    expect(e).not.toHaveProperty("stderr");
  });
  test.each([
    ["FAIL __tests__/fixture.test.ts", "validation-failed"],
    ["file.ts(1,2): error TS1234: private-value", "validation-failed"],
    [
      `fatal: Authentication failed for '${credentialUrl}'`,
      "authentication-failed",
    ],
    [" ! [remote rejected] HEAD -> branch (private-value)", "remote-rejected"],
    ["remote: error: GH013: private-value", "remote-rejected"],
    [
      `fatal: unable to access '${credentialUrl}': Could not resolve host: example.com`,
      "network-transport-failed",
    ],
  ])("classifies supported error signature %#", (stderr, classification) => {
    const result = safeFailure(
      new PublicationProcessError({
        status: 1,
        stderr,
        stdout: "private-value",
      }),
    );
    expect(result.evidence).toContain(classification);
    expect(JSON.stringify(result)).not.toContain("private-value");
  });
  test("adversarial payloads never become diagnostics, even beside recognized signatures", () => {
    const secret = "unexpected-sensitive-fixture";
    const raw = {
      status: 1,
      code: `ECONNRESET ${secret}`,
      signal: secret,
      message: secret,
      stdout: `🧹 Linting…\n🔎 Type checking…\n🛡️ Full coverage suite…\nAuthorization: Bearer ${secret}\nDATABASE_URL=${secret}`,
      stderr: `fatal: Authentication failed for 'https://user:${secret}@example.com'\n-----BEGIN PRIVATE KEY-----\n${secret}\n-----END PRIVATE KEY-----\nhusky - pre-push script failed (code 1)`,
    };
    const e = new PublicationProcessError(raw),
      out = JSON.stringify({ message: e.message, ...safeFailure(e) });
    expect(out).not.toMatch(
      /unexpected-sensitive|Authorization|DATABASE_URL|PRIVATE KEY|https:|user:/,
    );
    expect(safeFailure(e)).toMatchObject({
      lastPhase: "hook-coverage",
      hookExitCode: 1,
      evidence: ["local-hook-failed", "authentication-failed"],
    });
  });
  test("unknown output stays unclassified; progress alone does not prove hook failure", () => {
    expect(
      safeFailure(
        new PublicationProcessError({
          status: 1,
          stdout: "🧹 Linting…",
          stderr: "arbitrary secret",
        }),
      ),
    ).toEqual({ category: "exit", exitCode: 1, lastPhase: "hook-lint" });
    expect(
      safeFailure(
        new PublicationProcessError({
          status: 1,
          stdout: "secret phase name",
          stderr: "arbitrary secret",
        }),
      ),
    ).toEqual({ category: "exit", exitCode: 1, lastPhase: "git-push" });
  });
  test("publication still inspects the remote exactly once after classified failure", async () => {
    const d = fixture();
    d.push.mockRejectedValue(
      new PublicationProcessError({
        status: 1,
        stdout: "🛡️ Full coverage suite…",
        stderr: "FAIL fixture\nhusky - pre-push script failed (code 1)",
      }),
    );
    d.readRemote.mockResolvedValue(undefined);
    await publishExactCommit(sha, d);
    expect(d.push).toHaveBeenCalledTimes(1);
    expect(d.readRemote).toHaveBeenCalledTimes(1);
    expect(d.diagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "push",
        elapsedMs: 7,
        failure: expect.objectContaining({
          lastPhase: "hook-coverage",
          hookExitCode: 1,
        }),
      }),
    );
    expect(PUBLICATION_TIMEOUT_MS).toBe(600000);
  });
});
