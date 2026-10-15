/** @jest-environment node */
import type { spawnSync, SpawnSyncReturns } from "node:child_process";
import { codeCli, stagedDeploymentUrl } from "../../scripts/release/code-cli";
import { classifyCodeFailure } from "../../scripts/release/code-diagnostics";

const sensitive = "SENSITIVE_TOKEN_URL_HEADER_DO_NOT_LOG";
function runner(change: Partial<SpawnSyncReturns<string>>) {
  return jest.fn(() => ({
    pid: 0,
    status: 0,
    signal: null,
    output: [],
    stdout: "https://fixture.vercel.app",
    stderr: sensitive,
    ...change,
  })) as unknown as jest.MockedFunction<typeof spawnSync>;
}
test.each([
  { status: 2 },
  { status: null, signal: "SIGTERM" as const },
  {
    status: null,
    error: Object.assign(Error(sensitive), { code: "ETIMEDOUT" }),
  },
  { status: null, error: Object.assign(Error(sensitive), { code: "ENOENT" }) },
  { status: null, error: Object.assign(Error(sensitive), { code: sensitive }) },
])(
  "process failure retains safe structure and omits all process output",
  (change) => {
    const run = runner({ ...change, stdout: sensitive });
    let failure: unknown;
    try {
      codeCli("vercel.stage", ["deploy"], "team_fixture", sensitive, run);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeDefined();
    const diagnostic = classifyCodeFailure("production.check", failure);
    expect(diagnostic).toMatchObject({
      guard: "vercel.stage",
      operation: "vercel.stage",
      category: "process",
      exitStatus: change.status,
    });
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
    if ("signal" in change) expect(diagnostic.signal).toBe("SIGTERM");
    if ("error" in change && change.error && change.error.code !== sensitive)
      expect(diagnostic.spawnErrorCode).toBe(change.error.code);
  },
);
test("deployment child receives only the existing credential allowlist", () => {
  const run = runner({});
  expect(
    codeCli(
      "vercel.promote",
      ["promote", "dpl_fixture"],
      "team_fixture",
      sensitive,
      run,
    ),
  ).toBe("https://fixture.vercel.app");
  const options = run.mock.calls[0][2];
  expect(Object.keys(options?.env ?? {}).sort()).toEqual(
    [
      "CI",
      "HOME",
      "NODE_ENV",
      "NO_UPDATE_NOTIFIER",
      "PATH",
      "VERCEL_TELEMETRY_DISABLED",
      "VERCEL_TOKEN",
    ].sort(),
  );
  expect(run.mock.calls[0][1]).toEqual([
    "promote",
    "dpl_fixture",
    "--non-interactive",
    "--scope",
    "team_fixture",
  ]);
  expect(options).toMatchObject({ timeout: 900000, maxBuffer: 1024 * 1024 });
});

test.each([
  [
    JSON.stringify({
      status: "error",
      reason: "deploy_failed",
      message: sensitive,
    }),
    "",
    { reason: "deploy_failed" },
  ],
  [
    JSON.stringify({
      status: "error",
      reason: "scope_not_accessible",
      message: `Not authorized: Trying to access resource under scope ${sensitive}`,
      hint: sensitive,
      next: [{ command: sensitive }],
    }),
    "",
    { reason: "scope_not_accessible", message: "scope-access-denied" },
  ],
  [
    "",
    JSON.stringify({
      error: { code: "forbidden", statusCode: 403, message: sensitive },
    }),
    { code: "forbidden", httpStatus: 403 },
  ],
  [
    "",
    `Error: Git author ${sensitive} must have access to team ${sensitive}`,
    { message: "git-author-access-required" },
  ],
  [
    JSON.stringify({
      reason: sensitive,
      error: { code: sensitive, message: sensitive },
      env: sensitive,
    }),
    sensitive,
    undefined,
  ],
  ["x".repeat(17000) + sensitive, "", undefined],
])(
  "provider rejection retains bounded fixed labels without raw output",
  (stdout, stderr, provider) => {
    let failure: unknown;
    try {
      codeCli(
        "vercel.stage",
        ["deploy"],
        "team_fixture",
        sensitive,
        runner({ status: 1, stdout, stderr }),
      );
    } catch (error) {
      failure = error;
    }
    const diagnostic = classifyCodeFailure("production.check", failure);
    expect(diagnostic.provider).toEqual(provider);
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
  },
);

test("only stdout supplies a successful staged URL", () => {
  const output = codeCli(
    "vercel.stage",
    ["deploy"],
    "team_fixture",
    sensitive,
    runner({ stdout: "https://fixture.vercel.app\n", stderr: sensitive }),
  );
  expect(stagedDeploymentUrl(output).hostname).toBe("fixture.vercel.app");
});
test("pinned non-interactive JSON selects only the deployment origin", () => {
  expect(
    stagedDeploymentUrl(
      JSON.stringify({
        status: "ok",
        deployment: {
          url: "https://fixture.vercel.app",
          productionUrl: sensitive,
        },
        message: sensitive,
        next: [{ command: sensitive }],
      }),
    ).hostname,
  ).toBe("fixture.vercel.app");
});
test.each([
  { status: "error", deployment: { url: "https://fixture.vercel.app" } },
  { status: "ok", url: "https://fixture.vercel.app" },
  { status: "ok", deployment: { productionUrl: "https://fixture.vercel.app" } },
  { status: "ok", deployment: { url: "https://fixture.vercel.app/path" } },
  {
    status: "ok",
    deployment: { url: "https://user:password@fixture.vercel.app" },
  },
  { status: "ok", deployment: { url: 123 } },
])("rejects ambiguous, rejected or unsafe structured output %#", (value) => {
  expect(() => stagedDeploymentUrl(JSON.stringify(value))).toThrow(
    "code.stage-output-unresolved",
  );
});
test.each([
  "https://fixture.vercel.app/path",
  "https://user:password@fixture.vercel.app",
  "https://fixture.vercel.app?token=secret",
  "https://fixture.vercel.app.evil.example",
  "http://fixture.vercel.app",
  "https://fixture.vercel.app\nhttps://other.vercel.app",
  sensitive,
])("rejects unsafe successful provider URL", (value) => {
  expect(() => stagedDeploymentUrl(value)).toThrow(
    "code.stage-output-unresolved",
  );
});
