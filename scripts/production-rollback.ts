/** Explicit rollback only; preserves the reviewed manifest and protected human gate. */
import { execFileSync } from "node:child_process";

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
import { assertCodeRevision } from "./release/code-artifact";
import { reportCodeEvent, reportCodeFailure } from "./release/code-report";

import {
  checkCodeHealth,
  readHealthResponse,
  verifyHealthDomainAliases,
} from "./release/code-health";
import { checkPublicationHealth } from "./release/code-publication-health";
import { planArchiveListing } from "./release/code-publication-plan";

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
  await checkPublicationHealth(
    (path) =>
      readHealthResponse({
        stagedHost: d.url,
        publicDomain,
        path,
        // Relative image URLs belong to the canonical rendered-page origin.
        // The apex redirect strips Vercel's dpl image hint; do not relax its
        // strict path/query redirect check to accommodate that rewrite.
        publicOrigin: publicDomain ? "https://www.tullyelly.com" : undefined,
        bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        timeoutMs: 30000,
      }),
    undefined,
    planArchiveListing(manifest.rollback!.applicationSha),
  );
}
async function main() {
  manifest = await codeGuard("manifest.validation", () =>
    loadCodeManifest(
      process.env.RELEASE_MANIFEST_PATH ?? "",
      process.env.RELEASE_MANIFEST_SHA256 ?? "",
      process.env.RELEASE_SHA ?? "",
    ),
  );
  if (manifest.operation !== "rollback" || !manifest.rollback)
    throw new Error("code.unsupported-operation");
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
    console.log(
      `Reviewed rollback ${manifest.rollback!.deploymentId}; manifest SHA-256 ${required("RELEASE_MANIFEST_SHA256")}`,
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
    (previous.meta?.gitCommitSha ??
      previous.meta?.githubCommitSha ??
      previous.meta?.releaseSha) !==
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
    async lookup() {
      throw new Error("code.unsupported-operation");
    },
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
      throw new Error("code.unsupported-operation");
    },
    async promote() {
      throw new Error("code.unsupported-operation");
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
  const result = await executeCodeRelease(
    manifest,
    required("RELEASE_MANIFEST_SHA256"),
    "",
    providers,
  );
  const id = result.deploymentId;
  reportCodeEvent({ event: "deployment", deploymentId: id });
  reportCodeEvent({ event: "release-result", ...result });
  console.log(
    `Verified code-only ${manifest.operation}: ${id}; analytics remains disabled`,
  );
}
main().catch((error) => {
  const guard = "production.check";
  console.error(
    JSON.stringify({
      event: "code-release-failure",
      command: ["prepare", "check", "deploy"].includes(command)
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
