/** @jest-environment node */
import type { spawnSync, SpawnSyncReturns } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  codeCli,
  nativeSourceDeployArguments,
  stagedDeploymentUrl,
} from "../../scripts/release/code-cli";
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
      "XDG_CACHE_HOME",
      "XDG_CONFIG_HOME",
      "XDG_DATA_HOME",
    ].sort(),
  );
  expect(run.mock.calls[0][1]).toEqual([
    "promote",
    "dpl_fixture",
    "--non-interactive",
    "--scope",
    "team_fixture",
    "--global-config",
    expect.any(String),
  ]);
  expect(options).toMatchObject({ timeout: 900000, maxBuffer: 1024 * 1024 });
  expect(options?.env?.HOME).not.toBe(process.env.HOME);
  expect(existsSync(String(options?.env?.HOME))).toBe(false);
});

test("every CLI operation has fresh empty state and removes it even after provider failure", () => {
  const directories: string[] = [];
  const fake = ((...args: Parameters<typeof spawnSync>) => {
    const config = String(args[2]?.env?.XDG_CONFIG_HOME);
    const home = String(args[2]?.env?.HOME);
    expect(readdirSync(config)).toEqual([]);
    expect(readdirSync(home)).toEqual([]);
    directories.push(config, home);
    writeFileSync(
      join(config, "auth.json"),
      JSON.stringify({ token: "PLANTED_OWNER_LOGIN" }),
    );
    return {
      pid: 0,
      status: 1,
      signal: null,
      output: [],
      stdout: "",
      stderr: "",
    };
  }) as unknown as typeof spawnSync;
  for (const operation of [
    "vercel.auth-cli",
    "vercel.stage",
    "vercel.promote",
    "vercel.rollback",
  ] as const) {
    expect(() =>
      codeCli(
        operation,
        ["api", "/v9/projects/prj_fixture"],
        "team_fixture",
        sensitive,
        fake,
      ),
    ).toThrow();
  }
  expect(new Set(directories).size).toBe(directories.length);
  expect(directories.every((directory) => !existsSync(directory))).toBe(true);
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
    {
      reason: "scope_not_accessible",
      classification: "scope-access-denied",
      message:
        "Not authorized: Trying to access resource under scope [REDACTED]",
    },
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
    {
      classification: "git-author-access-required",
      message:
        "Error: Git author [REDACTED] must have access to team [REDACTED]",
    },
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
  "provider rejection retains bounded redacted error evidence without raw streams",
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

test("native source arguments bind one production candidate with only reviewed non-secret collection intent", () => {
  const binding = {
    projectId: "prj_fixture",
    commit: "a".repeat(40),
    evidenceDigest: "b".repeat(64),
    sourceDigest: "c".repeat(64),
    workflowRunId: "1234",
    workflowRunAttempt: "2",
    collectionEnabled: false,
  };
  const args = nativeSourceDeployArguments(binding);
  expect(args.slice(args.indexOf("--env"), args.indexOf("--env") + 2)).toEqual([
    "--env",
    "ANALYTICS_SYNC_ENABLED=false",
  ]);
  expect(args).toContain("analyticsCollectionEnabled=false");
  expect(args.slice(0, 7)).toEqual([
    "deploy",
    "--prod",
    "--skip-domain",
    "--yes",
    "--no-wait",
    "--project",
    binding.projectId,
  ]);
  expect(args).toEqual(
    expect.arrayContaining([
      `releaseSha=${binding.commit}`,
      `githubCommitSha=${binding.commit}`,
      `releaseEvidence=${binding.evidenceDigest}`,
      `releaseSourceSha256=${binding.sourceDigest}`,
      `releaseRunId=${binding.workflowRunId}`,
      `releaseRunAttempt=${binding.workflowRunAttempt}`,
    ]),
  );
  for (const forbidden of ["--prebuilt", "--build-env", "--token", "--force"]) {
    expect(args).not.toContain(forbidden);
  }
  const run = runner({});
  codeCli("vercel.stage", args, "team_fixture", sensitive, run, {
    cwd: "/isolated/approved-source",
  });
  expect(run.mock.calls[0][2]?.cwd).toBe("/isolated/approved-source");
});

test.each(["INITIALIZING", "QUEUED", "BUILDING", "READY", "ERROR"])(
  "no-wait JSON preserves candidate origin for authoritative %s readiness checks",
  (readyState) => {
    expect(
      stagedDeploymentUrl(
        JSON.stringify({
          status: "ok",
          deployment: { url: "https://fixture.vercel.app", readyState },
        }),
      ).origin,
    ).toBe("https://fixture.vercel.app");
  },
);

test("promotion rejection retains its operation and redacts planted credentials", () => {
  let failure: unknown;
  try {
    codeCli(
      "vercel.promote",
      ["promote", "dpl_fixture", "--yes"],
      "team_fixture",
      sensitive,
      runner({
        status: 1,
        stdout: JSON.stringify({
          status: "error",
          reason: "deploy_failed",
          message: `token=${sensitive}; postgres://fixture:${sensitive}@localhost/db`,
        }),
        stderr: `Authorization: Bearer ${sensitive}`,
      }),
    );
  } catch (error) {
    failure = error;
  }
  const diagnostic = classifyCodeFailure("production.check", failure);
  expect(diagnostic).toMatchObject({
    operation: "vercel.promote",
    exitStatus: 1,
    provider: { reason: "deploy_failed" },
  });
  for (const planted of [
    sensitive,
    "postgres://",
    "Authorization",
    "localhost",
  ]) {
    expect(JSON.stringify(diagnostic)).not.toContain(planted);
  }
});
