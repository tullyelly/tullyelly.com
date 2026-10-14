/** @jest-environment node */
import { readFileSync } from "node:fs";
import {
  assertVercelProject,
  settingsDigest,
  validateEnvironmentGate,
  validateReviewedMainRules,
  verifyRuntimeDatabase,
  verifyPreviewDatabases,
  verifyReleaseDeploymentIdentity,
  type ReleaseManifest,
} from "../../scripts/release/manifest";
const settings = {
  framework: "nextjs" as const,
  nodeVersion: "22.x" as const,
  buildCommand: null,
  installCommand: null,
  outputDirectory: null,
  rootDirectory: null,
};
const manifest = {
  commit: "a".repeat(40),
  neon: {
    host: "ep-prod.us-east-2.aws.neon.tech",
    database: "archive",
    role: "analytics",
  },
  vercel: {
    projectId: "prj_fixture",
    teamId: "team_fixture",
    productionDeploymentId: "dpl_previous",
    productionHost: "tullyelly.com",
    settings,
    settingsSha256: settingsDigest(settings),
  },
} as ReleaseManifest;
const gate = {
  can_admins_bypass: false,
  deployment_branch_policy: {
    custom_branch_policies: true,
    protected_branches: false,
  },
  protection_rules: [
    {
      type: "required_reviewers",
      prevent_self_review: true,
      reviewers: [{ type: "User", reviewer: { login: "owner" } }],
    },
  ],
};
const policies = { branch_policies: [{ name: "main", type: "branch" }] };
describe("human protected release", () => {
  it("binds reruns to exact reviewed build, source, manifest, project and disabled runtime", () => {
    const manifestDigest = "b".repeat(64),
      buildDigest = "c".repeat(64);
    const meta = {
      releaseSha: manifest.commit,
      releaseManifest: manifestDigest,
      releaseBuildSha256: buildDigest,
      collectionDisabled: "true",
    };
    const deployment = {
      projectId: manifest.vercel.projectId,
      target: "production",
      readyState: "READY",
      meta,
    };
    expect(() =>
      verifyReleaseDeploymentIdentity(
        deployment,
        manifest,
        manifestDigest,
        buildDigest,
      ),
    ).not.toThrow();
    for (const change of [
      { projectId: "prj_other" },
      { target: "preview" },
      { readyState: "BUILDING" },
      { meta: { ...meta, releaseSha: "d".repeat(40) } },
      { meta: { ...meta, releaseManifest: "d".repeat(64) } },
      { meta: { ...meta, releaseBuildSha256: "d".repeat(64) } },
      { meta: { ...meta, collectionDisabled: "false" } },
    ])
      expect(() =>
        verifyReleaseDeploymentIdentity(
          { ...deployment, ...change },
          manifest,
          manifestDigest,
          buildDigest,
        ),
      ).toThrow();
  });
  it("requires production application direct host, database, role and TLS", () => {
    const url =
      "postgresql://analytics@ep-prod.us-east-2.aws.neon.tech/archive?sslmode=require";
    expect(() => verifyRuntimeDatabase(url, manifest)).not.toThrow();
    for (const bad of [
      url.replace("ep-prod.", "ep-prod-pooler."),
      url.replace("analytics@", "other@"),
      url.replace("/archive?", "/other?"),
      url.replace("require", "disable"),
    ])
      expect(() => verifyRuntimeDatabase(bad, manifest)).toThrow();
  });
  it("requires isolated shared and branch-specific preview application databases", () => {
    const url =
      "postgresql://analytics@ep-test.us-east-2.aws.neon.tech/archive?sslmode=require";
    expect(() =>
      verifyPreviewDatabases(
        [{ value: url }, { value: url, gitBranch: "feature" }],
        manifest,
      ),
    ).not.toThrow();
    expect(() => verifyPreviewDatabases([], manifest)).toThrow();
    expect(() =>
      verifyPreviewDatabases([{ value: url, gitBranch: "feature" }], manifest),
    ).toThrow();
    expect(() =>
      verifyPreviewDatabases(
        [
          { value: url },
          { value: url.replace("ep-test.", "ep-prod."), gitBranch: "feature" },
        ],
        manifest,
      ),
    ).toThrow();
    expect(() =>
      verifyPreviewDatabases(
        [{ value: url.replace("ep-test.", "ep-test-pooler.") }],
        manifest,
      ),
    ).toThrow();
  });
  it("requires effective independent review and status rules, not protected boolean alone", () => {
    const rules = [
      {
        type: "pull_request",
        parameters: {
          required_approving_review_count: 1,
          dismiss_stale_reviews_on_push: true,
          require_code_owner_review: true,
          require_last_push_approval: true,
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: "Lint, test, build" }],
        },
      },
    ];
    expect(() => validateReviewedMainRules(rules)).not.toThrow();
    expect(() => validateReviewedMainRules([])).toThrow();
    expect(() =>
      validateReviewedMainRules([
        {
          ...rules[0],
          parameters: {
            ...rules[0].parameters,
            required_approving_review_count: 0,
          },
        },
        rules[1],
      ]),
    ).toThrow();
    expect(() =>
      validateReviewedMainRules([
        rules[0],
        {
          ...rules[1],
          parameters: { ...rules[1].parameters, required_status_checks: [] },
        },
      ]),
    ).toThrow();
  });
  it("requires actual non-bypassable required reviewer protection", () => {
    expect(() => validateEnvironmentGate(gate, policies)).not.toThrow();
    expect(() =>
      validateEnvironmentGate({ ...gate, can_admins_bypass: true }, policies),
    ).toThrow();
    expect(() =>
      validateEnvironmentGate({ ...gate, protection_rules: [] }, policies),
    ).toThrow();
    expect(() =>
      validateEnvironmentGate(
        {
          ...gate,
          protection_rules: [
            {
              type: "required_reviewers",
              prevent_self_review: false,
              reviewers: [{}],
            },
          ],
        },
        policies,
      ),
    ).toThrow();
  });
  it("rejects unrestricted, tag and wildcard release ref policies", () => {
    for (const policy of [
      { name: "*", type: "branch" },
      { name: "main", type: "tag" },
      { name: "cipher/*", type: "branch" },
    ])
      expect(() =>
        validateEnvironmentGate(gate, { branch_policies: [policy] }),
      ).toThrow();
    expect(() =>
      validateEnvironmentGate(gate, {
        branch_policies: [
          ...policies.branch_policies,
          { name: "other", type: "branch" },
        ],
      }),
    ).toThrow();
  });
  it("rejects wrong targets, Git deployment bypass and project drift", () => {
    const project = {
      ...settings,
      id: "prj_fixture",
      accountId: "team_fixture",
      link: null,
      targets: { production: { id: "dpl_previous" } },
    };
    expect(assertVercelProject(project, manifest)).toBe("dpl_previous");
    const { link: _link, ...disconnected } = project;
    expect(assertVercelProject(disconnected, manifest)).toBe("dpl_previous");
    for (const change of [
      { id: "prj_other" },
      { accountId: "team_other" },
      { link: { type: "github" } },
      { link: false },
      { link: "malformed" },
      { nodeVersion: "20.x" },
      { buildCommand: "unreviewed-command" },
    ])
      expect(() =>
        assertVercelProject({ ...project, ...change }, manifest),
      ).toThrow();
  });
  it("retains workflow secret, concurrency, build and rerun boundaries", () => {
    const workflow = readFileSync(
      ".github/workflows/production-release.yml",
      "utf8",
    );
    const prepare = workflow.slice(
      workflow.indexOf("  prepare:"),
      workflow.indexOf("  production:"),
    );
    expect(prepare).not.toContain("${{ secrets.");
    expect(workflow).toContain("environment: production-release");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).not.toMatch(/^  (push|pull_request):/m);
    expect(workflow).not.toMatch(/run:.*vercel pull/);
    expect(workflow).toContain("run-stage.mjs executor");
    expect(readFileSync("scripts/production-release.ts", "utf8")).toContain(
      "--skip-domain",
    );
    expect(workflow).toContain(
      "build_attempt: ${{ steps.plan.outputs.build_attempt }}",
    );
    expect(workflow).toContain(
      "name: ${{ needs.prepare.outputs.build_artifact }}",
    );
    expect(workflow).toContain(
      "RELEASE_BUILD_ATTEMPT: ${{ needs.prepare.outputs.build_attempt }}",
    );
  });
});
