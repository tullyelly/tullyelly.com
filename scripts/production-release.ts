/** Only the App-dispatched protected workflow may execute production mutations. */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { verifyChildDispatch, verifyHumanApproval } from "./release/app";
import {
  assertVercelProject,
  validateEnvironmentGate,
  validateReviewedMainRules,
} from "./release/manifest";
import { loadCodeManifest, type CodeManifest } from "./release/code-manifest";
import { executeCodeRelease, type CodeProviders } from "./release/code-release";
import { codeCli } from "./release/code-cli";
import {
  assertCodeRevision,
  artifactBinding,
  artifactCommand,
  buildFailure,
  packageCodeArtifact,
  restoreCodeArtifact,
  verifyBuildContext,
} from "./release/code-artifact";
import { reportCodeEvent, reportCodeFailure } from "./release/code-report";

import {
  checkCodeHealth,
  verifyHealthDomainAliases,
} from "./release/code-health";

import {
  codeGuard,
  codeMetadataRequest,
  missingConfiguration,
} from "./release/code-diagnostics";

const command = process.argv[2];
let manifest: CodeManifest;
function required(name: string) {
  const value = process.env[name];
  if (!value) throw missingConfiguration(name);
  return value;
}
const request = codeMetadataRequest;

let ghBase: string;
async function githubGate() {
  await codeGuard("github.child-dispatch", () =>
    verifyChildDispatch(process.env),
  );
  if (
    process.env.GITHUB_REF !== "refs/heads/main" ||
    process.env.GITHUB_EVENT_NAME !== "workflow_dispatch"
  )
    throw new Error("Production release requires manual dispatch from main");
  const token = required("GH_TOKEN");
  const [environment, policies, branch, rules] = await Promise.all([
    request(`${ghBase}/environments/production-release`, token),
    request(
      `${ghBase}/environments/production-release/deployment-branch-policies`,
      token,
    ),
    request(`${ghBase}/branches/main`, token),
    request(`${ghBase}/rules/branches/main`, token),
  ]);
  await codeGuard("github.environment", () =>
    validateEnvironmentGate(environment, policies),
  );
  await codeGuard("github.main-rules", () => validateReviewedMainRules(rules));
  const value = await codeGuard("github.main-response", () =>
    z
      .object({
        protected: z.literal(true),
        commit: z.object({ sha: z.string() }),
      })
      .parse(branch),
  );
  await codeGuard("github.main-binding", () => {
    if (value.commit.sha !== required("GITHUB_SHA"))
      throw new Error(
        "Protected main moved since dispatch; prepare a new reviewed release",
      );
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      manifest.commit,
      required("GITHUB_SHA"),
    ]);
    const changed = execFileSync(
      "git",
      ["diff", "--name-only", manifest.commit, required("GITHUB_SHA")],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    if (changed.some((path) => !/^releases\/[a-z0-9-]+\.json$/.test(path)))
      throw new Error(
        "Deployment code or dependencies differ from reviewed workflow commit; only release manifest metadata may differ",
      );
  });
}
let query: string;
async function vercel(path: string) {
  return request(
    `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}${query}`,
    required("VERCEL_TOKEN"),
  );
}
const deploymentSchema = z.object({
  id: z.string().regex(/^dpl_[A-Za-z0-9]+$/),
  url: z.string(),
  projectId: z.string(),
  target: z.string(),
  readyState: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
async function deployment(id: string) {
  return codeGuard("vercel.deployment", async () =>
    deploymentSchema.parse(
      await vercel(`/v13/deployments/${encodeURIComponent(id)}`),
    ),
  );
}
async function deploymentHistory() {
  const schema = z.object({
    deployments: z.array(
      z.object({
        uid: z.string(),
        readyState: z.string(),
        meta: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
    pagination: z.object({ next: z.number().nullable() }),
  });
  const all: z.infer<typeof schema>["deployments"] = [];
  let cursor: number | null = null;
  const seen = new Set<number>();
  for (let page = 0; page < 10; page++) {
    const r = await codeGuard("vercel.history", async () =>
      schema.parse(
        await vercel(
          `/v6/deployments?projectId=${manifest.vercel.projectId}&target=production&limit=100${cursor === null ? "" : `&until=${cursor}`}`,
        ),
      ),
    );
    all.push(...r.deployments);
    if (r.pagination.next === null) return all;
    if (seen.has(r.pagination.next))
      throw new Error("code.deployment-pagination-loop");
    seen.add(r.pagination.next);
    cursor = r.pagination.next;
  }
  throw new Error("code.incomplete-deployment-history");
}
async function lookup() {
  const matches = (await deploymentHistory()).filter(
    (d) =>
      d.meta?.releaseSha === manifest.commit &&
      d.meta?.releaseManifest === required("RELEASE_MANIFEST_SHA256"),
  );
  if (matches.length > 1) throw new Error("code.ambiguous-deployment-identity");
  if (matches.length) return deployment(matches[0].uid);
  return undefined;
}
async function guard(allowed: string[]) {
  return codeGuard("production.check", async () => {
    await githubGate();
    await codeGuard("human.approval", () => verifyHumanApproval(process.env));
    const project = await vercel(`/v9/projects/${manifest.vercel.projectId}`);
    const current = await codeGuard("vercel.project", () =>
      assertVercelProject(project, manifest),
    );
    const hooks = await codeGuard("vercel.git-hooks", () =>
      z.object({ link: z.null().optional() }).passthrough().parse(project),
    );
    const record = hooks as Record<string, unknown>;
    if (Array.isArray(record.deployHooks) && record.deployHooks.length)
      throw new Error("code.deploy-hooks-present");
    if (!current || !allowed.includes(current))
      throw new Error("code.production-drift");
    await codeGuard("vercel.aliases", async () =>
      verifyHealthDomainAliases(
        await Promise.all(
          ["tullyelly.com", "www.tullyelly.com"].map((host) =>
            vercel(`/v4/aliases/${host}`),
          ),
        ),
        manifest.vercel.projectId,
        current,
      ),
    );
    if (
      (await deploymentHistory()).some((d) =>
        ["QUEUED", "BUILDING", "INITIALIZING"].includes(d.readyState),
      )
    )
      throw new Error("code.concurrent-deployment");
    // Metadata only. Never request decrypted values, DB URLs, cron secrets or Neon APIs.
    const env = await codeGuard("vercel.environment", async () =>
      z
        .object({
          envs: z.array(
            z.object({
              id: z.string(),
              key: z.string(),
              target: z.array(z.string()).optional(),
            }),
          ),
          pagination: z.object({ next: z.number().nullable() }).optional(),
        })
        .parse(await vercel(`/v10/projects/${manifest.vercel.projectId}/env`)),
    );
    if (env.pagination?.next)
      throw new Error("code.incomplete-environment-metadata");
    if (
      env.envs.filter(
        (e) => e.key === "DATABASE_URL" && e.target?.includes("production"),
      ).length !== 1
    )
      throw new Error("code.runtime-database-configuration");
    return current;
  });
}

async function health(
  d: z.infer<typeof deploymentSchema>,
  publicDomain: boolean,
) {
  await checkCodeHealth({
    deployment: d,
    projectId: manifest.vercel.projectId,
    publicDomain,
    operation: manifest.operation,
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  });
}
async function main() {
  manifest = await codeGuard("manifest.validation", () =>
    loadCodeManifest(
      process.env.RELEASE_MANIFEST_PATH ?? "",
      process.env.RELEASE_MANIFEST_SHA256 ?? "",
      process.env.RELEASE_SHA ?? "",
    ),
  );
  await codeGuard("github.application-binding", () =>
    assertCodeRevision(manifest.commit),
  );
  reportCodeEvent({
    event: "context",
    revision: manifest.commit,
    operation: manifest.operation,
    manifestSha256: required("RELEASE_MANIFEST_SHA256"),
    settingsSha256: manifest.vercel.settingsSha256,
    previousDeployment: manifest.vercel.productionDeploymentId,
    targetRevision: manifest.rollback?.applicationSha ?? manifest.commit,
    rollbackDeployment: manifest.rollback?.deploymentId,
  });
  ghBase = `https://api.github.com/repos/${required("GITHUB_REPOSITORY")}`;
  query = `teamId=${encodeURIComponent(manifest.vercel.teamId)}`;
  if (command === "prepare") {
    await githubGate();
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      manifest.schemaCompatibility.previousApplicationSha,
      required("GITHUB_SHA"),
    ]);
    if (manifest.rollback)
      execFileSync("git", [
        "merge-base",
        "--is-ancestor",
        manifest.rollback.applicationSha,
        required("GITHUB_SHA"),
      ]);
    mkdirSync(".vercel", { recursive: true });
    writeFileSync(
      ".vercel/project.json",
      JSON.stringify({
        orgId: manifest.vercel.teamId,
        projectId: manifest.vercel.projectId,
        settings: manifest.vercel.settings,
      }),
    );
    writeFileSync(".vercel/.env.production.local", "");
    console.log(
      `Code-only ${manifest.operation}; application SHA ${manifest.commit}; manifest SHA-256 ${required("RELEASE_MANIFEST_SHA256")}`,
    );
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `operation=${manifest.operation}\nbuild_attempt=${required("GITHUB_RUN_ATTEMPT")}\n`,
      );
    return;
  }
  if (command === "build") {
    if (manifest.operation !== "deploy")
      throw new Error("code.rollback-cannot-build");
    if (
      [".env", ".env.local", ".env.production", ".env.production.local"].some(
        existsSync,
      )
    )
      throw new Error("code.build-local-env-present");
    await codeGuard("build.configuration", () => verifyBuildContext(manifest));
    const r = spawnSync(
      "python3",
      ["scripts/release/code-build-context.py", "."],
      {
        stdio: ["ignore", "inherit", "pipe"],
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        timeout: 1800000,
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH,
          HOME: required("RELEASE_BUILD_HOME"),
          CI: "true",
          NO_UPDATE_NOTIFIER: "1",
          NEXT_TELEMETRY_DISABLED: "1",
          VERCEL_TELEMETRY_DISABLED: "1",
          ...manifest.buildEnvironment,
          SKIP_DB: "true",
          ANALYTICS_SYNC_ENABLED: "false",
          NEXTAUTH_SECRET: "CODE_RELEASE_BUILD_ONLY_SECRET",
          NEXTAUTH_URL: "https://tullyelly.com",
          GOOGLE_CLIENT_ID: "CODE_RELEASE_BUILD_ONLY_CLIENT",
          GOOGLE_CLIENT_SECRET: "CODE_RELEASE_BUILD_ONLY_GOOGLE",
        },
      },
    );
    if (r.status !== 0 || r.error) throw buildFailure(r);
    const artifact = await codeGuard("artifact.package", () =>
      packageCodeArtifact(
        artifactBinding(
          manifest,
          required("RELEASE_MANIFEST_SHA256"),
          required("GITHUB_RUN_ID"),
          required("GITHUB_RUN_ATTEMPT"),
        ),
        required("RUNNER_TEMP"),
      ),
    );
    reportCodeEvent({
      event: "artifact",
      ...artifact,
      buildAttempt: required("GITHUB_RUN_ATTEMPT"),
    });
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `sha256=${artifact.sha256}\nsize_bytes=${artifact.sizeBytes}\n`,
      );
    console.log(
      `Canonical production artifact: SHA-256 ${artifact.sha256}; ${artifact.sizeBytes} bytes; build attempt ${required("GITHUB_RUN_ATTEMPT")}`,
    );
    return;
  }
  if (command === "restore") {
    if (manifest.operation !== "deploy")
      throw new Error("code.rollback-cannot-build");
    mkdirSync(".vercel", { recursive: true });
    await restoreCodeArtifact(
      artifactBinding(
        manifest,
        required("RELEASE_MANIFEST_SHA256"),
        required("GITHUB_RUN_ID"),
        required("RELEASE_BUILD_ATTEMPT"),
      ),
      required("RELEASE_BUILD_SHA256"),
      required("RUNNER_TEMP"),
    );
    return;
  }
  if (
    process.env.RELEASE_PRODUCTION_APPROVED !== "true" ||
    process.env.GITHUB_ACTIONS !== "true"
  )
    throw new Error("code.human-gate-required");
  await codeGuard("production.check", () =>
    guard([manifest.vercel.productionDeploymentId]),
  );
  const previous = await deployment(manifest.vercel.productionDeploymentId);
  if (
    previous.projectId !== manifest.vercel.projectId ||
    previous.target !== "production" ||
    previous.readyState !== "READY" ||
    (previous.meta?.githubCommitSha ?? previous.meta?.releaseSha) !==
      manifest.schemaCompatibility.previousApplicationSha
  )
    throw new Error("code.previous-application-identity");
  if (command === "check") {
    await guard([previous.id]);
    return;
  }
  if (command !== "deploy") throw new Error("code.unsupported-operation");
  const providers: CodeProviders = {
    guard,
    deployment,
    lookup,
    health,
    reportDeployment(d) {
      reportCodeEvent({ event: "deployment", deploymentId: d.id });
    },
    reportReconciliation(diagnostic) {
      reportCodeEvent({
        event: "reconciliation",
        diagnostic: diagnostic.originalFailure,
      });
      console.error(
        JSON.stringify({ event: "code-release-reconciliation", ...diagnostic }),
      );
    },
    async stage() {
      // A provider lookup may reuse only identical production evidence; staging
      // always rechecks the bound, safely extracted canonical output.
      artifactCommand([
        "verify",
        ".vercel/output",
        JSON.stringify(
          artifactBinding(
            manifest,
            required("RELEASE_MANIFEST_SHA256"),
            required("GITHUB_RUN_ID"),
            required("RELEASE_BUILD_ATTEMPT"),
          ),
        ),
      ]);
      const output = codeCli(
        "vercel.stage",
        [
          "deploy",
          "--prebuilt",
          "--prod",
          "--skip-domain",
          "--yes",
          "--project",
          manifest.vercel.projectId,
          "--meta",
          `releaseSha=${manifest.commit}`,
          "--meta",
          `githubCommitSha=${manifest.commit}`,
          "--meta",
          `releaseManifest=${required("RELEASE_MANIFEST_SHA256")}`,
          "--meta",
          `releaseBuildSha256=${required("RELEASE_BUILD_SHA256")}`,
          "--meta",
          "collectionDisabled=true",
          "--env",
          "ANALYTICS_SYNC_ENABLED=false",
        ],
        manifest.vercel.teamId,
        required("VERCEL_TOKEN"),
      );
      const u = new URL(output);
      if (
        u.protocol !== "https:" ||
        !/^[a-z0-9-]+\.vercel\.app$/.test(u.hostname) ||
        u.origin !== output
      )
        throw new Error("code.stage-output-unresolved");
      return deployment(u.hostname);
    },
    async promote(id) {
      codeCli(
        "vercel.promote",
        ["promote", id, "--yes"],
        manifest.vercel.teamId,
        required("VERCEL_TOKEN"),
      );
    },
    async rollback(id) {
      codeCli(
        "vercel.rollback",
        ["rollback", id, "--yes"],
        manifest.vercel.teamId,
        required("VERCEL_TOKEN"),
      );
    },
  };
  const id = await executeCodeRelease(
    manifest,
    required("RELEASE_MANIFEST_SHA256"),
    manifest.operation === "deploy" ? required("RELEASE_BUILD_SHA256") : "",
    providers,
  );
  reportCodeEvent({ event: "deployment", deploymentId: id });
  console.log(
    `Verified code-only ${manifest.operation}: ${id}; analytics remains disabled`,
  );
}
main().catch((error) => {
  const guard =
    command === "build"
      ? "build.production"
      : command === "restore"
        ? "artifact.validation"
        : "production.check";
  console.error(
    JSON.stringify({
      event: "code-release-failure",
      command: ["prepare", "build", "restore", "check", "deploy"].includes(
        command,
      )
        ? command
        : "unknown",
      ...reportCodeFailure(guard, error),
    }),
  );
  console.error(
    "Release stopped; only allowlisted diagnostic fields are emitted. No automatic retry or recovery.",
  );
  process.exitCode = 1;
});
