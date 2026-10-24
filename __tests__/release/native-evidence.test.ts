/** @jest-environment node */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  blockingCompatibilityRisks,
  compatibilityRisks,
  configurationEvidence,
  loadNativeEvidence,
  nativeSettingsSchema,
  trustedRequiredCi,
  validateNativeEvidence,
} from "../../scripts/release/native-evidence";
import { settingsDigest, sha256 } from "../../scripts/release/manifest";
import {
  RELEASE_REPOSITORY,
  RELEASE_REPOSITORY_ID,
  type Api,
} from "../../scripts/release/app";

const sha = "a".repeat(40),
  settings = {
    framework: "nextjs" as const,
    nodeVersion: "22.x" as const,
    buildCommand: null,
    installCommand: null,
    outputDirectory: null,
    rootDirectory: null,
  };

test("native settings permit the reviewed build wrapper and reject arbitrary provider commands", () => {
  const { buildCommand } = JSON.parse(readFileSync("vercel.json", "utf8"));
  expect(
    nativeSettingsSchema.parse({ ...settings, buildCommand }).buildCommand,
  ).toBe(buildCommand);
  expect(() =>
    nativeSettingsSchema.parse({
      ...settings,
      buildCommand: "npm run build:vercel",
    }),
  ).toThrow();
});
function evidence() {
  return {
    version: 3,
    kind: "native-source",
    operation: "deploy",
    commit: sha,
    collectionEnabled: false,
    workflow: { sha, runId: "100", runAttempt: "1" },
    source: { sha256: "b".repeat(64) },
    ci: {
      runId: "200",
      runAttempt: "1",
      sha,
      workflowSha: sha,
      workflowPath: ".github/workflows/ci.yml",
      workflowId: "300",
      checkRunIds: ["400", "401"],
    },
    vercel: {
      projectId: "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
      teamId: "team_pB5TcLa7apLtPAiVrRbcjBG3",
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
    compatibility: {
      changedPaths: ["content/chronicles/example.mdx"],
      risks: [],
    },
    publication: {
      archive: { path: "/shaolin/newest", title: "Newest Chronicle" },
      chronicles: [],
      assets: [],
    },
  };
}

test("automatic evidence binds exact application/workflow/CI revisions, own run attempt and checksum", () => {
  const root = mkdtempSync(join(tmpdir(), "native-evidence-"));
  try {
    const file = join(root, "evidence.json"),
      bytes = JSON.stringify(evidence());
    writeFileSync(file, bytes);
    const env = {
      GITHUB_SHA: sha,
      GITHUB_RUN_ID: "100",
      GITHUB_RUN_ATTEMPT: "1",
    };
    expect(loadNativeEvidence(file, sha256(bytes), sha, env).commit).toBe(sha);
    expect(() => loadNativeEvidence(file, "f".repeat(64), sha, env)).toThrow(
      "code.evidence-digest",
    );
    expect(() =>
      loadNativeEvidence(file, sha256(bytes), sha, {
        ...env,
        GITHUB_RUN_ATTEMPT: "2",
      }),
    ).toThrow("code.evidence-workflow-binding");
    for (const changed of [
      { workflow: { ...evidence().workflow, sha: "f".repeat(40) } },
      { ci: { ...evidence().ci, sha: "f".repeat(40) } },
    ])
      expect(() =>
        validateNativeEvidence({ ...evidence(), ...changed }),
      ).toThrow("code.evidence-revision");
    expect(() =>
      validateNativeEvidence({
        ...evidence(),
        vercel: {
          ...evidence().vercel,
          settings: { ...settings, buildCommand: "SENSITIVE_DO_NOT_PUBLISH" },
        },
      }),
    ).toThrow();
    expect(() =>
      validateNativeEvidence({
        ...evidence(),
        compatibility: {
          changedPaths: ["db/migrations/100_example.sql"],
          risks: ["database-schema"],
        },
      }),
    ).toThrow("code.sensitive-compatibility-review");
    expect(() =>
      validateNativeEvidence({
        ...evidence(),
        compatibility: {
          changedPaths: ["lib/auth/permissions.ts"],
          risks: ["authentication-policy"],
        },
      }),
    ).not.toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("archive evidence is required, bounded and independent of changed chronicles", () => {
  expect(validateNativeEvidence(evidence()).publication.archive).toEqual({
    path: "/shaolin/newest",
    title: "Newest Chronicle",
  });
  for (const archive of [
    undefined,
    null,
    { path: "/shaolin/newest", title: "" },
    { path: "/shaolin/newest", title: "x".repeat(301) },
    { path: "https://example.com/shaolin/newest", title: "Newest" },
    { path: "/shaolin/../newest", title: "Newest" },
    { path: "/shaolin/newest?query=1", title: "Newest" },
    { path: "/shaolin/newest", title: "Newest", commit: sha },
  ])
    expect(() =>
      validateNativeEvidence({
        ...evidence(),
        publication: { ...evidence().publication, archive },
      }),
    ).toThrow();
});

test("metadata-only config evidence never publishes planted credentials, raw env values or bypass settings", () => {
  const planted = "SENSITIVE_DO_NOT_PUBLISH",
    project = {
      ssoProtection: { deploymentType: "all_except_custom_domains" },
      protectionBypass: { [planted]: { scope: "automation-bypass" } },
    };
  const env = {
    envs: [
      {
        id: "database",
        key: "DATABASE_URL",
        type: "encrypted",
        target: ["production"],
        value: planted,
      },
      { id: "secret", key: planted, target: ["production"], value: planted },
    ],
  };
  const result = configurationEvidence(project, env);
  expect(JSON.stringify(result)).not.toContain(planted);
  expect(result).toEqual({
    protectionSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    environmentMetadataSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(
    configurationEvidence({ ...project, ssoProtection: null }, env)
      .protectionSha256,
  ).not.toBe(result.protectionSha256);
  expect(
    configurationEvidence(project, {
      envs: env.envs.map((e) => ({ ...e, updatedAt: 1 })),
    }).environmentMetadataSha256,
  ).not.toBe(result.environmentMetadataSha256);
  expect(() =>
    configurationEvidence(project, { ...env, pagination: { next: 123 } }),
  ).toThrow("code.incomplete-environment-metadata");
  expect(
    configurationEvidence({ ...project, skewProtectionBoundaryAt: 123 }, env)
      .protectionSha256,
  ).toBe(
    configurationEvidence({ ...project, skewProtectionBoundaryAt: 456 }, env)
      .protectionSha256,
  );
  expect(
    configurationEvidence({ ...project, skewProtectionMaxAge: 123 }, env)
      .protectionSha256,
  ).not.toBe(
    configurationEvidence({ ...project, skewProtectionMaxAge: 456 }, env)
      .protectionSha256,
  );
  expect(
    configurationEvidence(project, {
      envs: env.envs.map((item) => ({
        ...item,
        value: "CHANGED_ENCRYPTED_PROVIDER_VALUE",
      })),
    }).environmentMetadataSha256,
  ).toBe(result.environmentMetadataSha256);
});

test("compatibility surfaces code review risks and blocks operations with separate sensitive procedures", () => {
  expect(
    compatibilityRisks(
      ["content/chronicles/example.mdx", "scripts/release/native-evidence.ts"],
      () => "+safe",
    ),
  ).toEqual([]);
  expect(
    compatibilityRisks(
      ["lib/auth/permissions.ts"],
      () => "-return false;\n+return true;",
    ),
  ).toEqual(["authentication-policy"]);
  expect(
    compatibilityRisks(
      ["lib/example-db.ts"],
      () => "+SELECT new_column FROM dojo.example",
    ),
  ).toEqual(["database-query-contract"]);
  expect(
    compatibilityRisks(
      ["vercel.json"],
      () => '+  "buildCommand": "npm run build:vercel",',
    ),
  ).toEqual([]);
  expect(compatibilityRisks(["vercel.json"], () => '+  "crons": [],')).toEqual([
    "runtime-configuration",
  ]);
  expect(
    blockingCompatibilityRisks([
      "database-schema",
      "database-query-contract",
      "authentication-policy",
      "runtime-configuration",
      "analytics-activation",
    ]),
  ).toEqual(["database-schema", "analytics-activation"]);
  const guard =
    '+import { isNextBuild } from "@/lib/env";\n+  if (isNextBuild()) {\n+    throw new Error("Prisma access disabled during Next.js production build.");\n+  }';
  expect(compatibilityRisks(["auth.ts"], () => guard)).toEqual([]);
  expect(
    compatibilityRisks(
      ["auth.ts"],
      () => guard + "\n+callbacks: { session() { return {}; } }",
    ),
  ).toEqual(["authentication-policy"]);
});

function ciApi(changeRun: object = {}, changeCheck: object = {}) {
  const run = {
    id: 200,
    run_attempt: 1,
    workflow_id: 300,
    head_sha: sha,
    head_branch: "main",
    event: "push",
    path: ".github/workflows/ci.yml",
    status: "completed",
    conclusion: "success",
    head_repository: {
      id: RELEASE_REPOSITORY_ID,
      full_name: RELEASE_REPOSITORY,
    },
    check_suite_id: 500,
    ...changeRun,
  };
  const checks = ["Lint, test, build", "coverage"].map((name, index) => ({
    id: 400 + index,
    name,
    head_sha: sha,
    status: "completed",
    conclusion: "success",
    app: { id: 15368, slug: "github-actions" },
    check_suite: { id: 500 },
    ...(index === 0 ? changeCheck : {}),
  }));
  return jest.fn<ReturnType<Api>, Parameters<Api>>(async (path) =>
    path.endsWith("/actions/workflows/ci.yml")
      ? { id: 300, path: ".github/workflows/ci.yml", state: "active" }
      : path.includes("/runs?")
        ? { workflow_runs: [run] }
        : { total_count: 2, check_runs: checks },
  );
}
test("only a successful trusted push-main CI run and GitHub Actions checks for the exact SHA can be reused", async () => {
  await expect(trustedRequiredCi(sha, "TOKEN", ciApi())).resolves.toMatchObject(
    { runId: "200", sha, workflowSha: sha, checkRunIds: ["400", "401"] },
  );
  for (const changed of [
    { event: "pull_request" },
    { head_sha: "f".repeat(40) },
    { path: ".github/workflows/untrusted.yml" },
    { workflow_id: 301 },
    { head_repository: { id: 1, full_name: "attacker/fork" } },
    { conclusion: "failure" },
  ])
    await expect(
      trustedRequiredCi(sha, "TOKEN", ciApi(changed)),
    ).rejects.toThrow("code.required-ci-unavailable");
  for (const changed of [
    { app: { id: 1, slug: "github-actions" } },
    { app: { id: 15368, slug: "forged" } },
    { check_suite: { id: 501 } },
    { head_sha: "f".repeat(40) },
    { conclusion: "failure" },
  ])
    await expect(
      trustedRequiredCi(sha, "TOKEN", ciApi({}, changed)),
    ).rejects.toThrow("code.required-ci-unavailable");
});
