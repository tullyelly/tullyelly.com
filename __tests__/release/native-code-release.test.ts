/** @jest-environment node */
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  createCleanSource,
  sourceArchiveDigest,
} from "../../scripts/release/code-source";
import {
  executeCodeRelease,
  nativeReleaseMessage,
  type CodePhaseEvent,
  type CodeProviders,
} from "../../scripts/release/code-release";
import type { NativeCodeEvidence } from "../../scripts/release/native-evidence";
import { settingsDigest } from "../../scripts/release/manifest";
import {
  CodeHealthError,
  classifyCodeFailure,
} from "../../scripts/release/code-diagnostics";

function evidence(): NativeCodeEvidence {
  const settings = {
    framework: "nextjs" as const,
    nodeVersion: "22.x" as const,
    buildCommand: null,
    installCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  };
  return {
    version: 3,
    kind: "native-source",
    operation: "deploy",
    commit: "a".repeat(40),
    collectionEnabled: false,
    workflow: { sha: "a".repeat(40), runId: "123", runAttempt: "1" },
    source: { sha256: "b".repeat(64) },
    ci: {
      runId: "122",
      runAttempt: "1",
      sha: "a".repeat(40),
      workflowSha: "a".repeat(40),
      workflowPath: ".github/workflows/ci.yml",
      workflowId: "1",
      checkRunIds: ["1", "2"],
    },
    vercel: {
      teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
      projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
      productionDeploymentId: "dpl_previous",
      productionHost: "tullyelly.com",
      settings,
      settingsSha256: settingsDigest(settings),
    },
    baseline: { applicationSha: "c".repeat(40) },
    config: {
      protectionSha256: "d".repeat(64),
      environmentMetadataSha256: "e".repeat(64),
    },
    compatibility: { changedPaths: [], risks: [] },
    publication: {
      archive: { path: "/shaolin/target-newest", title: "Target newest" },
      chronicles: [],
      assets: [],
    },
  };
}
function fixture() {
  const m = evidence();
  let current = "dpl_previous";
  const d = {
    id: "dpl_native",
    url: "native.vercel.app",
    projectId: m.vercel.projectId,
    target: "production",
    readyState: "QUEUED",
    meta: {
      releaseSha: m.commit,
      githubCommitSha: m.commit,
      releaseEvidence: "f".repeat(64),
      releaseSourceSha256: m.source.sha256,
      releaseRunId: m.workflow.runId,
      releaseRunAttempt: m.workflow.runAttempt,
      collectionDisabled: "true",
    },
  };
  const p: CodeProviders = {
    guard: jest.fn(async (allowed) => {
      if (!allowed.includes(current)) throw new Error("drift");
      return current;
    }),
    lookup: jest.fn(async () => undefined),
    stage: jest.fn(async () => ({ ...d })),
    deployment: jest.fn(async () => ({ ...d, readyState: "READY" })),
    waitForPoll: jest.fn(async () => {}),
    promote: jest.fn(async (id) => {
      current = id;
    }),
    rollback: jest.fn(async () => {}),
    health: jest.fn(async () => {}),
  };
  return {
    m,
    p,
    d,
    setCurrent: (id: string) => {
      current = id;
    },
    run: () => executeCodeRelease(m, "f".repeat(64), "", p),
  };
}
test("accepted native deployment reaches READY on the same ID before health and promotion", async () => {
  const { p, d, run } = fixture();
  p.deployment = jest
    .fn()
    .mockResolvedValueOnce({ ...d, readyState: "INITIALIZING" })
    .mockResolvedValueOnce({ ...d, readyState: "BUILDING" })
    .mockResolvedValueOnce({ ...d, readyState: "READY" });
  expect(await run()).toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.deployment).toHaveBeenCalledTimes(3);
  expect(p.deployment).toHaveBeenCalledWith(d.id);
  expect(p.promote).toHaveBeenCalledTimes(1);
  expect(p.promote).toHaveBeenCalledWith(d.id);
  expect(p.health).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ id: d.id, readyState: "READY" }),
    false,
  );
  expect(p.health).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ id: d.id, readyState: "READY" }),
    true,
  );
});
test.each(["ERROR", "CANCELED", "UNKNOWN", "ACCEPTED"])(
  "native %s readiness never promotes",
  async (readyState) => {
    const { p, d, run } = fixture();
    p.stage = jest.fn(async () => ({ ...d, readyState }));
    await expect(run()).rejects.toThrow();
    expect(p.promote).not.toHaveBeenCalled();
    expect(p.health).not.toHaveBeenCalled();
  },
);
test("bounded native readiness timeout never promotes or deploys again", async () => {
  const { p, d, run } = fixture();
  p.deployment = jest.fn(async () => ({ ...d, readyState: "BUILDING" }));
  await expect(run()).rejects.toThrow("code.deployment-readiness-timeout");
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).not.toHaveBeenCalled();
});
test("failed native build preserves identified deployment and only allowlisted provider diagnostics", async () => {
  const { p, d, run } = fixture();
  p.reportDeployment = jest.fn();
  p.stage = jest.fn(async () => ({
    ...d,
    readyState: "ERROR",
    providerError: {
      code: "build_failed",
      message: "PLANTED_SECRET_DO_NOT_LOG",
    },
  }));
  let error: unknown;
  try {
    await run();
  } catch (failure) {
    error = failure;
  }
  const diagnostic = classifyCodeFailure("production.check", error);
  expect(diagnostic).toMatchObject({
    guard: "vercel.deployment",
    invariant: "code.deployment-build-failed",
    provider: { code: "build_failed" },
  });
  expect(JSON.stringify(diagnostic)).not.toContain("PLANTED_SECRET");
  expect(p.reportDeployment).toHaveBeenCalledWith(
    expect.objectContaining({ id: d.id }),
  );
  expect(p.promote).not.toHaveBeenCalled();
});
test("native readiness cannot substitute another deployment or metadata identity", async () => {
  for (const change of [
    { id: "dpl_other" },
    { meta: {} },
    { target: "preview" },
  ]) {
    const { p, d, run } = fixture();
    p.deployment = jest.fn(async () => ({
      ...d,
      readyState: "READY",
      ...change,
    }));
    await expect(run()).rejects.toThrow();
    expect(p.promote).not.toHaveBeenCalled();
  }
});
test("ambiguous source stage reconciles one accepted deployment and polls it without another upload", async () => {
  const { p, d, run } = fixture();
  p.stage = jest.fn(async () => {
    throw new Error("timeout");
  });
  p.lookup = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(d);
  expect(await run()).toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.deployment).toHaveBeenCalledWith(d.id);
});
test("failed native staged checks and production drift block promotion", async () => {
  for (const drift of [false, true]) {
    const { p, run, setCurrent } = fixture();
    p.health = jest.fn(async () => {
      if (drift) setCurrent("dpl_drift");
      else throw new Error("health");
    });
    await expect(run()).rejects.toThrow();
    expect(p.promote).not.toHaveBeenCalled();
  }
});
test("phase reporting observes one opaque CLI call and confirms build completion only after READY", async () => {
  const { p, d, run } = fixture();
  const phases: CodePhaseEvent[] = [];
  p.reportPhase = (event) => phases.push(event);
  p.deployment = jest.fn(async () => {
    expect(phases).not.toContainEqual(
      expect.objectContaining({ phase: "remote-build", outcome: "success" }),
    );
    return { ...d, readyState: "READY" };
  });
  await expect(run()).resolves.toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(phases.map(({ phase, outcome }) => `${phase}:${outcome}`)).toEqual([
    "deployment-creation:started",
    "cli-invocation-upload:started",
    "cli-invocation-upload:success",
    "deployment-creation:success",
    "remote-build:started",
    "remote-build:success",
    "staged-verification:started",
    "staged-verification:success",
    "promotion:started",
    "promotion:success",
    "public-verification:started",
    "public-verification:success",
  ]);
  for (const event of phases.filter((event) => event.outcome !== "started")) {
    expect(Number.isSafeInteger(event.durationMs)).toBe(true);
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  }
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).toHaveBeenCalledTimes(1);
  expect(p.rollback).not.toHaveBeenCalled();
});
test("unresolved stage reports CLI and creation failure without inventing a deployment or build", async () => {
  const { p, run } = fixture();
  const phases: CodePhaseEvent[] = [];
  p.reportPhase = (event) => phases.push(event);
  p.stage = jest.fn(async () => {
    throw new Error("opaque process failure");
  });
  await expect(run()).rejects.toThrow();
  expect(phases.map(({ phase, outcome }) => `${phase}:${outcome}`)).toEqual([
    "deployment-creation:started",
    "cli-invocation-upload:started",
    "cli-invocation-upload:failure",
    "deployment-creation:failure",
  ]);
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).not.toHaveBeenCalled();
});
test("reconciled stage preserves the failed CLI observation and proceeds with the same candidate", async () => {
  const { p, d, run } = fixture();
  const phases: CodePhaseEvent[] = [];
  p.reportPhase = (event) => phases.push(event);
  p.stage = jest.fn(async () => {
    throw new Error("timeout");
  });
  p.lookup = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(d);
  await expect(run()).resolves.toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(phases).toContainEqual(
    expect.objectContaining({
      phase: "cli-invocation-upload",
      outcome: "failure",
    }),
  );
  expect(phases).toContainEqual(
    expect.objectContaining({
      phase: "deployment-creation",
      outcome: "success",
    }),
  );
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).toHaveBeenCalledWith(d.id);
});
test.each(["build", "staged", "promotion", "public"])(
  "failed %s records only phases actually reached",
  async (boundary) => {
    const { p, d, run } = fixture();
    const phases: CodePhaseEvent[] = [];
    p.reportPhase = (event) => phases.push(event);
    if (boundary === "build")
      p.deployment = jest.fn(async () => ({ ...d, readyState: "ERROR" }));
    if (boundary === "staged" || boundary === "public")
      p.health = jest.fn(async (_d, publicDomain) => {
        if (publicDomain === (boundary === "public"))
          throw new Error("health failed");
      });
    if (boundary === "promotion")
      p.promote = jest.fn(async () => {
        throw new Error("promotion failed");
      });
    await expect(run()).rejects.toThrow();
    const failed =
      boundary === "build"
        ? "remote-build"
        : boundary === "staged"
          ? "staged-verification"
          : boundary === "public"
            ? "public-verification"
            : "promotion";
    expect(phases).toContainEqual(
      expect.objectContaining({ phase: failed, outcome: "failure" }),
    );
    expect(phases).not.toContainEqual(
      expect.objectContaining({ phase: failed, outcome: "success" }),
    );
    if (boundary === "build" || boundary === "staged") {
      expect(phases.some((event) => event.phase === "promotion")).toBe(false);
      expect(p.promote).not.toHaveBeenCalled();
    }
    if (boundary !== "public")
      expect(
        phases.some((event) => event.phase === "public-verification"),
      ).toBe(false);
    expect(p.rollback).not.toHaveBeenCalled();
  },
);
function inRepository(
  run: (directory: string, commit: string) => void,
  additional?: (directory: string) => void,
) {
  const directory = mkdtempSync(join(tmpdir(), "native-source-test-"));
  const previous = process.cwd();
  try {
    execFileSync("git", ["init", "--quiet", directory]);
    writeFileSync(join(directory, "source.txt"), "reviewed source");
    additional?.(directory);
    execFileSync("git", ["add", "."], { cwd: directory });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.test",
        "commit",
        "--quiet",
        "--no-verify",
        "-m",
        "Reviewed source",
      ],
      { cwd: directory },
    );
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: directory,
      encoding: "utf8",
    }).trim();
    process.chdir(directory);
    run(directory, commit);
  } finally {
    process.chdir(previous);
    rmSync(directory, { recursive: true, force: true });
  }
}
test("source export contains reviewed bytes while dirty files, local secrets and generated builds remain outside", () => {
  inRepository((directory, commit) => {
    const digest = sourceArchiveDigest(commit);
    writeFileSync(join(directory, "source.txt"), "dirty validation source");
    writeFileSync(
      join(directory, ".env.local"),
      "PLANTED_SECRET_DO_NOT_UPLOAD",
    );
    mkdirSync(join(directory, ".next"));
    writeFileSync(join(directory, ".next", "output"), "stale output");
    const source = createCleanSource({
      commit,
      sha256: digest,
      projectId: "prj_fixture",
      teamId: "team_fixture",
      temporaryDirectory: directory,
    });
    expect(readFileSync(join(source.directory, "source.txt"), "utf8")).toBe(
      "reviewed source",
    );
    expect(existsSync(join(source.directory, ".env.local"))).toBe(false);
    expect(existsSync(join(source.directory, ".next"))).toBe(false);
    expect(
      JSON.parse(
        readFileSync(join(source.directory, "release-source.json"), "utf8"),
      ),
    ).toEqual({ commit, archiveSha256: digest });
    source.dispose();
    expect(existsSync(source.directory)).toBe(false);
    expect(() =>
      createCleanSource({
        commit,
        sha256: "0".repeat(64),
        projectId: "prj_fixture",
        teamId: "team_fixture",
        temporaryDirectory: directory,
      }),
    ).toThrow("code.source-digest");
  });
});
test.each(["symlink", "receipt", "project"])(
  "source exporter rejects tracked %s overrides",
  (kind) => {
    inRepository(
      (_directory, commit) => {
        expect(() => sourceArchiveDigest(commit)).toThrow(
          "code.source-unsafe-tree",
        );
      },
      (directory) => {
        if (kind === "symlink")
          symlinkSync("/etc/passwd", join(directory, "escape"));
        if (kind === "receipt")
          writeFileSync(join(directory, "release-source.json"), "{}");
        if (kind === "project") {
          mkdirSync(join(directory, ".vercel"));
          writeFileSync(join(directory, ".vercel/project.json"), "{}");
        }
      },
    );
  },
);
test("remote build metadata embeds the exported source revision without Git or provider revision env", () => {
  const script = resolve("scripts/gen-build-info.mjs"),
    directory = mkdtempSync(join(tmpdir(), "native-build-info-"));
  try {
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ name: "fixture", version: "1" }),
    );
    writeFileSync(
      join(directory, "release-source.json"),
      JSON.stringify({ commit: "a".repeat(40), archiveSha256: "b".repeat(64) }),
    );
    const env = {
      NODE_ENV: "production" as const,
      PATH: process.env.PATH,
      VERCEL: "1" as const,
      VERCEL_ENV: "production" as const,
    };
    expect(
      spawnSync(process.execPath, [script], { cwd: directory, env }).status,
    ).toBe(0);
    expect(
      readFileSync(join(directory, "lib/build-info.ts"), "utf8"),
    ).toContain(`"commit": "${"a".repeat(40)}"`);
    rmSync(join(directory, "release-source.json"));
    expect(
      spawnSync(process.execPath, [script], { cwd: directory, env }).status,
    ).toBe(1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
test("native build subprocess blocks database credentials with build flags confined to that subprocess", () => {
  const script = resolve("scripts/release/native-build.mjs"),
    directory = mkdtempSync(join(tmpdir(), "native-build-env-"));
  try {
    writeFileSync(
      join(directory, "npm"),
      "#!/usr/bin/env node\nconsole.log(JSON.stringify({skip:process.env.SKIP_DB,phase:process.env.NEXT_PHASE,databasePresent:!!process.env.DATABASE_URL,testDatabasePresent:!!process.env.TEST_DATABASE_URL}));\n",
      { mode: 0o755 },
    );
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      encoding: "utf8",
      env: {
        NODE_ENV: "production",
        PATH: `${directory}:${process.env.PATH}`,
        DATABASE_URL: "PLANTED_DATABASE_SECRET",
        TEST_DATABASE_URL: "PLANTED_TEST_DATABASE_SECRET",
      },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("PLANTED");
    expect(JSON.parse(result.stdout)).toEqual({
      skip: "true",
      phase: "phase-production-build",
      databasePresent: false,
      testDatabasePresent: false,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function cloudflareError() {
  return new CodeHealthError("/", 403, "security-challenge", {
    initialOrigin: "https://tullyelly.com",
    effectiveOrigin: "https://tullyelly.com",
    responses: [
      {
        origin: "https://tullyelly.com",
        hop: 0,
        status: 403,
        timestamp: "2026-10-18T16:45:10.176Z",
        headers: {
          "cf-mitigated": "challenge",
          "cf-ray": "a4c9030a7b8f6b31-DFW",
        },
      },
    ],
  });
}
test("confirmed public Cloudflare challenge records pending only after fresh exact production guards", async () => {
  const { p, d, run } = fixture();
  const phases: CodePhaseEvent[] = [];
  p.reportPhase = (e) => phases.push(e);
  p.health = jest.fn(async (_, publicDomain) => {
    if (publicDomain) throw cloudflareError();
  });
  const result = await run();
  expect(result).toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: false,
    publicVerification: "public verification pending",
    reason: {
      guard: "health.public",
      status: 403,
      health: {
        request: { responses: [{ headers: { "cf-mitigated": "challenge" } }] },
      },
    },
  });
  expect(p.guard).toHaveBeenLastCalledWith([d.id]);
  expect(p.deployment).toHaveBeenLastCalledWith(d.id);
  expect(phases.at(-1)).toMatchObject({
    phase: "public-verification",
    outcome: "pending",
  });
  expect(phases).not.toContainEqual(
    expect.objectContaining({
      phase: "public-verification",
      outcome: "success",
    }),
  );
  expect(nativeReleaseMessage(result)).toContain("public verification pending");
  expect(nativeReleaseMessage(result)).not.toContain("Verified native source");
  expect(p.rollback).not.toHaveBeenCalled();
});
test("ordinary full acceptance still reports verified native source", async () => {
  const { run } = fixture();
  const result = await run();
  expect(result.public_verified).toBe(true);
  expect(nativeReleaseMessage(result)).toContain("Verified native source");
});
test("Cloudflare staged rejection stays fatal and never promotes", async () => {
  const { p, run } = fixture();
  p.health = jest.fn(async () => {
    throw cloudflareError();
  });
  await expect(run()).rejects.toThrow();
  expect(p.promote).not.toHaveBeenCalled();
});
test.each([
  "bare-403",
  "vercel",
  "missing-ray",
  "invalid-ray",
  "missing-trace",
  "evil-origin",
  "invalid-time",
  "wrong-status",
  "generic-condition",
  "message-only",
  "revision",
  "auth",
  "publication",
  "asset",
  "redirect",
  "timeout",
  "5xx",
])("public %s remains fatal", async (kind) => {
  const { p, run } = fixture();
  const error = cloudflareError();
  const trace = error.health.request!;
  const response = trace.responses[0];
  let failure: unknown = error;
  if (kind === "bare-403") response.headers = {};
  if (kind === "vercel")
    response.headers = { "x-vercel-mitigated": "challenge" };
  if (kind === "missing-ray") delete response.headers["cf-ray"];
  if (kind === "invalid-ray") response.headers["cf-ray"] = "secret-unsafe";
  if (kind === "missing-trace") delete error.health.request;
  if (kind === "evil-origin")
    trace.initialOrigin =
      response.origin =
      trace.effectiveOrigin =
        "https://evil.test";
  if (kind === "invalid-time") response.timestamp = "bad";
  if (kind === "wrong-status")
    failure = new CodeHealthError("/", 500, "security-challenge", {
      ...trace,
      responses: [{ ...response, status: 500 }],
    });
  if (kind === "generic-condition")
    failure = new CodeHealthError("/", 403, "security-challenge");
  if (kind === "message-only")
    failure = new Error("cf-mitigated: challenge HTTP 403");
  const assertions: Record<string, string> = {
    revision: "code.version-sha",
    auth: "code.owner-auth",
    publication: "code.publication-content",
    asset: "code.publication-asset",
    redirect: "code.health-redirect",
    timeout: "code.health-timeout",
    "5xx": "code.health-page",
  };
  if (assertions[kind]) failure = new Error(assertions[kind]);
  p.health = jest.fn(async (_, publicDomain) => {
    if (publicDomain) throw failure;
  });
  await expect(run()).rejects.toThrow();
  expect(p.rollback).not.toHaveBeenCalled();
});
test.each(["target", "alias", "revision", "deployment-id", "readiness"])(
  "pending rejects fresh %s drift",
  async (kind) => {
    const { p, d, run, setCurrent } = fixture();
    p.health = jest.fn(async (_, publicDomain) => {
      if (!publicDomain) return;
      if (kind === "target") setCurrent("dpl_drift");
      if (kind === "alias")
        p.guard = jest.fn(async () => {
          throw new Error("code.alias-deployment");
        });
      if (["revision", "deployment-id", "readiness"].includes(kind))
        p.deployment = jest.fn(async () => ({
          ...d,
          readyState: kind === "readiness" ? "BUILDING" : "READY",
          id: kind === "deployment-id" ? "dpl_other" : d.id,
          meta: kind === "revision" ? {} : d.meta,
        }));
      throw cloudflareError();
    });
    await expect(run()).rejects.toThrow();
    expect(p.rollback).not.toHaveBeenCalled();
  },
);

test.each(["www", "apex-to-www"])(
  "confirmed challenge from %s retains the validated trace",
  async (origin) => {
    const { p, run } = fixture();
    const error = cloudflareError();
    const trace = error.health.request!;
    const last = trace.responses[0];
    last.origin = trace.effectiveOrigin = "https://www.tullyelly.com";
    if (origin === "www") trace.initialOrigin = last.origin;
    else {
      last.hop = 1;
      trace.responses.unshift({
        origin: trace.initialOrigin,
        hop: 0,
        status: 308,
        timestamp: last.timestamp,
        headers: {},
      });
    }
    p.health = jest.fn(async (_, publicDomain) => {
      if (publicDomain) throw error;
    });
    await expect(run()).resolves.toMatchObject({ public_verified: false });
  },
);
test("pending requires confirmed promotion even when the candidate unexpectedly equals the baseline", async () => {
  const { m, d, p, run, setCurrent } = fixture();
  m.vercel.productionDeploymentId = d.id;
  setCurrent(d.id);
  p.health = jest.fn(async (_, publicDomain) => {
    if (publicDomain) throw cloudflareError();
  });
  await expect(run()).rejects.toThrow();
  expect(p.promote).not.toHaveBeenCalled();
});
