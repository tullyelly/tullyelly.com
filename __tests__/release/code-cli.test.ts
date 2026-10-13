/** @jest-environment node */
import type { spawnSync, SpawnSyncReturns } from "node:child_process";
import { codeCli } from "../../scripts/release/code-cli";
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
