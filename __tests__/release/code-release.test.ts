/** @jest-environment node */
import {
  readFileSync,
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  PRODUCTION_DATABASE_HOST,
  validateCodeManifest,
  loadCodeManifest,
  type CodeManifest,
} from "../../scripts/release/code-manifest";
import {
  executeCodeRelease,
  type CodeProviders,
} from "../../scripts/release/code-release";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
} from "../../scripts/release/code-diagnostics";
import { settingsDigest, sha256 } from "../../scripts/release/manifest";
const settings = {
  framework: "nextjs" as const,
  nodeVersion: "22.x" as const,
  buildCommand: null,
  installCommand: null,
  rootDirectory: null,
  outputDirectory: null,
};
function manifest(): CodeManifest {
  return validateCodeManifest({
    version: 2,
    kind: "code-only",
    operation: "deploy",
    commit: "a".repeat(40),
    vercel: {
      projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
      teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
      productionDeploymentId: "dpl_previous",
      productionHost: "tullyelly.com",
      settings,
      settingsSha256: settingsDigest(settings),
    },
    collectionEnabled: false,
    buildEnvironment: {},
    schemaCompatibility: {
      checkedAt: new Date().toISOString(),
      checkedBy: "tullyelly",
      evidenceUrl: "https://github.com/tullyelly/tullyelly.com/issues/1",
      previousApplicationSha: "b".repeat(40),
      databaseHost: PRODUCTION_DATABASE_HOST,
      database: "tullyelly_db",
      method: "read-only-catalog-check",
      requiredObjects: ["dojo.tags"],
      missingObjects: [],
      compatible: true,
      rollbackCompatible: true,
    },
  });
}
function fixture(m = manifest()) {
  let current = "dpl_previous";
  const d = {
    id: "dpl_new",
    url: "fixture.vercel.app",
    projectId: m.vercel.projectId,
    target: "production",
    readyState: "READY",
    meta: {
      releaseSha: m.commit,
      releaseManifest: "c".repeat(64),
      releaseBuildSha256: "d".repeat(64),
      collectionDisabled: "true",
    },
  };
  const p: CodeProviders = {
    guard: jest.fn(async (allowed) => {
      if (!allowed.includes(current)) throw Error("drift");
      return current;
    }),
    lookup: jest.fn(async () => undefined),
    stage: jest.fn(async () => d),
    deployment: jest.fn(async () => d),
    promote: jest.fn(async (id) => {
      current = id;
    }),
    rollback: jest.fn(async (id) => {
      current = id;
    }),
    health: jest.fn(async () => {}),
  };
  return {
    p,
    d,
    setCurrent: (id: string) => {
      current = id;
    },
  };
}
const run = (m: CodeManifest, p: CodeProviders) =>
  executeCodeRelease(m, "c".repeat(64), "d".repeat(64), p);
test("verified deployment identity remains observable when staged health fails", async () => {
  const m = manifest();
  const { p, d } = fixture(m);
  p.reportDeployment = jest.fn();
  p.health = jest.fn(async () => {
    throw new Error("code.health-owner-authorization");
  });
  await expect(run(m, p)).rejects.toMatchObject({
    diagnostic: {
      guard: "health.staged",
      invariant: "code.health-owner-authorization",
    },
  });
  expect(p.reportDeployment).toHaveBeenCalledWith(d);
  expect(p.promote).not.toHaveBeenCalled();
});
test("a preview or mismatched production artifact is never reported as verified evidence", async () => {
  const m = manifest();
  const { p, d } = fixture(m);
  p.reportDeployment = jest.fn();
  d.target = "preview";
  await expect(run(m, p)).rejects.toMatchObject({
    diagnostic: {
      guard: "vercel.identity",
      invariant: "code.deployment-identity",
    },
  });
  expect(p.reportDeployment).not.toHaveBeenCalled();
  expect(p.health).not.toHaveBeenCalled();
  expect(p.promote).not.toHaveBeenCalled();
});
test("strict code-only manifest rejects activation, SQL plans, missing schema and unrelated targets", () => {
  const m = manifest();
  for (const change of [
    { migrations: [] },
    {
      schemaCompatibility: {
        ...m.schemaCompatibility,
        databaseHost: "ep-other.example",
      },
    },
    { neon: {} },
    { baselineLedgerSha256: "e".repeat(64) },
    { collectionEnabled: true },
    { buildEnvironment: { DATABASE_URL: "redacted" } },
    {
      schemaCompatibility: {
        ...m.schemaCompatibility,
        missingObjects: ["dojo.tags"],
      },
    },
    { schemaCompatibility: { ...m.schemaCompatibility, compatible: false } },
    {
      schemaCompatibility: {
        ...m.schemaCompatibility,
        checkedAt: "2000-01-01T00:00:00Z",
      },
    },
    { vercel: { ...m.vercel, projectId: "prj_other" } },
  ])
    expect(() => validateCodeManifest({ ...m, ...change })).toThrow();
});
test("manifest digest and exact SHA are independently bound", () => {
  const dir = mkdtempSync(join(tmpdir(), "code-manifest-"));
  try {
    const path = join(dir, "manifest.json"),
      m = manifest(),
      bytes = JSON.stringify(m);
    writeFileSync(path, bytes);
    expect(loadCodeManifest(path, sha256(bytes), m.commit)).toEqual(m);
    expect(() => loadCodeManifest(path, "f".repeat(64), m.commit)).toThrow();
    expect(() =>
      loadCodeManifest(path, sha256(bytes), "f".repeat(40)),
    ).toThrow();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("normal stage, prepromotion guard, promotion and public health", async () => {
  const m = manifest(),
    { p } = fixture(m);
  expect(await run(m, p)).toMatchObject({
    deploymentId: "dpl_new",
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).toHaveBeenCalledTimes(1);
  expect(p.health).toHaveBeenCalledTimes(2);
});
test("unexpected public assignment during stage stops without promote or retry", async () => {
  const m = manifest(),
    { p, d, setCurrent } = fixture(m);
  p.stage = jest.fn(async () => {
    setCurrent(d.id);
    return d;
  });
  await expect(run(m, p)).rejects.toThrow();
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.promote).not.toHaveBeenCalled();
  expect(p.health).not.toHaveBeenCalled();
});
test("identity or artifact mismatch never promotes", async () => {
  for (const change of [
    { projectId: "prj_other" },
    { meta: {} },
    { readyState: "BUILDING" },
  ]) {
    const m = manifest(),
      { p, d } = fixture(m);
    p.stage = jest.fn(async () => ({ ...d, ...change }));
    await expect(run(m, p)).rejects.toThrow();
    expect(p.promote).not.toHaveBeenCalled();
  }
});
test("successful write followed by timeout is inspected, not retried", async () => {
  const m = manifest(),
    { p, d } = fixture(m);
  p.stage = jest.fn(async () => {
    throw Error("timeout");
  });
  p.lookup = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(d);
  expect(await run(m, p)).toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(p.stage).toHaveBeenCalledTimes(1);
  expect(p.lookup).toHaveBeenCalledTimes(2);
});
test("unresolved write and API lookup failures stop without another write", async () => {
  for (const apiFailure of [false, true]) {
    const m = manifest(),
      { p } = fixture(m);
    p.stage = jest.fn(async () => {
      throw Error("timeout");
    });
    if (apiFailure)
      p.lookup = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(Error("503"));
    await expect(run(m, p)).rejects.toThrow();
    expect(p.stage).toHaveBeenCalledTimes(1);
    expect(p.promote).not.toHaveBeenCalled();
  }
});
test("wrong SHA after ambiguous write is rejected", async () => {
  const m = manifest(),
    { p, d } = fixture(m);
  p.stage = jest.fn(async () => {
    throw Error("failure");
  });
  p.lookup = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({
      ...d,
      meta: { ...d.meta, releaseSha: "f".repeat(40) },
    });
  await expect(run(m, p)).rejects.toThrow();
  expect(p.promote).not.toHaveBeenCalled();
});
test("guard failure, health failure and prepromotion drift prevent promotion", async () => {
  for (const boundary of ["initial", "health", "drift"]) {
    const m = manifest(),
      { p, setCurrent } = fixture(m);
    if (boundary === "initial")
      p.guard = jest.fn(async () => {
        throw Error("approval or drift");
      });
    else
      p.health = jest.fn(async () => {
        if (boundary === "health") throw Error("health");
        setCurrent("dpl_unexpected");
      });
    await expect(run(m, p)).rejects.toThrow();
    expect(p.promote).not.toHaveBeenCalled();
    if (boundary === "initial") expect(p.stage).not.toHaveBeenCalled();
  }
});
test("ambiguous promotion is reconciled once, including unresolved outcome", async () => {
  for (const succeeded of [true, false]) {
    const m = manifest(),
      { p, setCurrent } = fixture(m);
    p.promote = jest.fn(async (id) => {
      if (succeeded) setCurrent(id);
      throw Error("timeout");
    });
    if (succeeded)
      await expect(run(m, p)).resolves.toMatchObject({
        deploymentId: "dpl_new",
        deployment_succeeded: true,
        public_verified: true,
      });
    else await expect(run(m, p)).rejects.toThrow("unresolved");
    expect(p.promote).toHaveBeenCalledTimes(1);
  }
});
test("separately bound rollback validates identity, never stages, and reconciles timeout", async () => {
  for (const bad of [false, true]) {
    const m = manifest();
    m.operation = "rollback";
    m.rollback = {
      deploymentId: "dpl_good",
      applicationSha: "b".repeat(40),
      collectionDisabledVerified: true,
    };
    const { p, d, setCurrent } = fixture(m);
    p.deployment = jest.fn(async () => ({
      ...d,
      id: "dpl_good",
      meta: {
        githubCommitSha: bad ? "e".repeat(40) : m.rollback!.applicationSha,
      },
    }));
    p.rollback = jest.fn(async (id) => {
      setCurrent(id);
      throw Error("timeout");
    });
    if (bad) await expect(run(m, p)).rejects.toThrow("identity");
    else
      await expect(run(m, p)).resolves.toMatchObject({
        deploymentId: "dpl_good",
        deployment_succeeded: true,
        public_verified: true,
      });
    expect(p.stage).not.toHaveBeenCalled();
    expect(p.promote).not.toHaveBeenCalled();
    expect(p.rollback).toHaveBeenCalledTimes(bad ? 0 : 1);
  }
});
test("native workflow keeps read-only metadata separate and cannot invoke sensitive executors", () => {
  const w = readFileSync(".github/workflows/production-release.yml", "utf8");
  const prepare = w.slice(w.indexOf("  prepare:"), w.indexOf("  production:"));
  expect(prepare).toContain("${{ secrets.VERCEL_RELEASE_READ_TOKEN }}");
  expect(prepare).not.toContain("${{ secrets.VERCEL_RELEASE_TOKEN }}");
  expect(w).not.toMatch(
    /release-db|NEON_API_KEY|RELEASE_DATABASE_URL|maintenance\.ts|db:migrate|seed|approved-prebuilt|run-stage\.mjs restore/,
  );
  expect(w).toContain("environment: production-release");
  const code = readFileSync("scripts/production-release.ts", "utf8");
  expect(code).not.toMatch(
    /console\.neon|env\/\$\{|cronSecret|RELEASE_DATABASE_URL|prebuiltDeployArguments|code-build-context\.py/,
  );
  expect(code).toContain("createCleanSource");
  expect(code).toContain("nativeSourceDeployArguments");
  expect(
    readFileSync(".github/workflows/analytics-release.yml", "utf8"),
  ).toContain("scripts/release-db.ts apply");
});
test.each([
  "portable",
  "external-link",
  "placeholder",
  "runtime-skip",
  "runtime-analytics",
  "env-file",
])("real Python artifact verifier handles %s", (kind) => {
  const dir = mkdtempSync(join(tmpdir(), "code-artifact-"));
  try {
    const root = join(dir, "output");
    mkdirSync(root);
    writeFileSync(join(root, "config.json"), JSON.stringify({ version: 3 }));
    if (kind === "external-link")
      symlinkSync("/etc/passwd", join(root, "escape"));
    if (kind === "placeholder")
      writeFileSync(join(root, "index.js"), "CODE_RELEASE_BUILD_ONLY_SECRET");
    if (kind === "runtime-skip")
      writeFileSync(
        join(root, ".vc-config.json"),
        JSON.stringify({ environment: { SKIP_DB: "true" } }),
      );
    if (kind === "runtime-analytics")
      writeFileSync(
        join(root, ".vc-config.json"),
        JSON.stringify({ environment: { ANALYTICS_SYNC_ENABLED: "true" } }),
      );
    if (kind === "env-file") writeFileSync(join(root, ".env.local"), "fixture");
    const r = spawnSync(
      "python3",
      ["scripts/release/code-artifact.py", "verify", root],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(kind === "portable" ? 0 : 1);
    expect(r.stderr).not.toContain("CODE_RELEASE_BUILD_ONLY_SECRET");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("checksum bound extraction rejects tampering before touching destination", () => {
  const dir = mkdtempSync(join(tmpdir(), "code-extract-"));
  try {
    const archive = join(dir, "build.tar"),
      target = join(dir, "clean"),
      root = join(dir, "source/.vercel/output");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "config.json"), ' {"version":3} ');
    expect(
      spawnSync("tar", [
        "-cf",
        archive,
        "-C",
        join(dir, "source"),
        ".vercel/output",
      ]).status,
    ).toBe(0);
    const digest = sha256(readFileSync(archive));
    expect(
      spawnSync("python3", [
        "scripts/release/code-artifact.py",
        "extract",
        archive,
        target,
        digest,
      ]).status,
    ).toBe(0);
    writeFileSync(archive, "tampered");
    expect(
      spawnSync("python3", [
        "scripts/release/code-artifact.py",
        "extract",
        archive,
        join(dir, "bad"),
        digest,
      ]).status,
    ).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("rollback unresolved outcome does not retry or stage", async () => {
  const m = manifest();
  m.operation = "rollback";
  m.rollback = {
    deploymentId: "dpl_good",
    applicationSha: "b".repeat(40),
    collectionDisabledVerified: true,
  };
  const { p, d } = fixture(m);
  p.deployment = jest.fn(async () => ({
    ...d,
    id: "dpl_good",
    meta: { githubCommitSha: m.rollback!.applicationSha },
  }));
  p.rollback = jest.fn(async () => {
    throw Error("timeout");
  });
  await expect(run(m, p)).rejects.toThrow("unresolved");
  expect(p.rollback).toHaveBeenCalledTimes(1);
  expect(p.stage).not.toHaveBeenCalled();
});

test("artifact diagnostics allow only recognized invariants, never arbitrary paths", () => {
  const dir = mkdtempSync(join(tmpdir(), "artifact-diagnostics-"));
  try {
    writeFileSync(join(dir, "config.json"), JSON.stringify({ version: 3 }));
    writeFileSync(
      join(dir, ".env.SENSITIVE_PATH_DO_NOT_LOG"),
      "SENSITIVE_VALUE_DO_NOT_LOG",
    );
    let r = spawnSync(
      "python3",
      ["scripts/release/code-artifact.py", "verify", dir],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(1);
    expect(r.stderr.trim()).toBe(
      "Code-only artifact validation failed: code.artifact-env-file; values omitted",
    );
    rmSync(join(dir, ".env.SENSITIVE_PATH_DO_NOT_LOG"));
    writeFileSync(
      join(dir, "config.json"),
      "SENSITIVE_MALFORMED_JSON_DO_NOT_LOG",
    );
    r = spawnSync(
      "python3",
      ["scripts/release/code-artifact.py", "verify", dir],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(1);
    expect(r.stderr.trim()).toBe(
      "Code-only artifact validation failed: code.artifact-validation-failed; values omitted",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test.each([false, true])(
  "stage failure survives remote reconciliation failure=%s without a second write",
  async (lookupFails) => {
    const m = manifest(),
      { p } = fixture(m);
    p.stage = jest.fn(async () => {
      throw new CodeDiagnosticError({
        guard: "vercel.stage",
        operation: "vercel.stage",
        category: "process",
        exitStatus: 2,
        signal: null,
        processCategory: "exit",
        provider: {
          reason: "permission_denied",
          code: "forbidden",
          httpStatus: 403,
        },
      });
    });
    p.lookup = jest.fn().mockResolvedValueOnce(undefined);
    if (lookupFails)
      (p.lookup as jest.Mock).mockRejectedValueOnce(
        new CodeDiagnosticError({
          guard: "api.request",
          operation: "vercel.history",
          category: "http",
          status: 503,
        }),
      );
    else (p.lookup as jest.Mock).mockResolvedValueOnce(undefined);
    let failure: unknown;
    try {
      await run(m, p);
    } catch (error) {
      failure = error;
    }
    const diagnostic = classifyCodeFailure("production.check", failure);
    expect(diagnostic).toMatchObject({
      guard: "vercel.stage",
      category: "invariant",
      invariant: lookupFails
        ? "code.stage-reconciliation-failed"
        : "code.stage-outcome-unresolved",
      reconciliation: lookupFails ? "failed" : "not-found",
      originalFailure: {
        guard: "vercel.stage",
        category: "process",
        exitStatus: 2,
        provider: {
          reason: "permission_denied",
          code: "forbidden",
          httpStatus: 403,
        },
      },
    });
    if (lookupFails)
      expect(diagnostic.reconciliationFailure).toMatchObject({
        operation: "vercel.history",
        status: 503,
      });
    expect(p.stage).toHaveBeenCalledTimes(1);
    expect(p.promote).not.toHaveBeenCalled();
  },
);
test("recovered stage reports original failure alongside the found outcome", async () => {
  const m = manifest(),
    { p, d } = fixture(m);
  p.reportReconciliation = jest.fn();
  p.stage = jest.fn(async () => {
    throw new CodeDiagnosticError({
      guard: "vercel.stage",
      category: "process",
      exitStatus: null,
      spawnErrorCode: "ETIMEDOUT",
    });
  });
  p.lookup = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(d);
  expect(await run(m, p)).toMatchObject({
    deploymentId: d.id,
    deployment_succeeded: true,
    public_verified: true,
  });
  expect(p.reportReconciliation).toHaveBeenCalledWith({
    outcome: "found",
    originalFailure: expect.objectContaining({
      guard: "vercel.stage",
      spawnErrorCode: "ETIMEDOUT",
    }),
  });
  expect(p.stage).toHaveBeenCalledTimes(1);
});

test.each(["deploy", "rollback"] as const)(
  "legacy %s keeps confirmed Cloudflare public challenges fatal",
  async (operation) => {
    const m = manifest();
    m.operation = operation;
    if (operation === "rollback")
      m.rollback = {
        deploymentId: "dpl_good",
        applicationSha: "b".repeat(40),
        collectionDisabledVerified: true,
      };
    const { p, d } = fixture(m);
    if (operation === "rollback")
      p.deployment = jest.fn(async () => ({
        ...d,
        id: "dpl_good",
        meta: { githubCommitSha: m.rollback!.applicationSha },
      }));
    p.health = jest.fn(async (_, publicDomain) => {
      if (publicDomain)
        throw new CodeDiagnosticError({
          guard: "health.public",
          category: "invariant",
          invariant: "code.health-page",
          status: 403,
          health: {
            path: "/",
            condition: "security-challenge",
            request: {
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
            },
          },
        });
    });
    await expect(run(m, p)).rejects.toThrow();
    expect(p.rollback).toHaveBeenCalledTimes(operation === "rollback" ? 1 : 0);
  },
);
