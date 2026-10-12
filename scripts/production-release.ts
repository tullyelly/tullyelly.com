/** Only the App-dispatched protected workflow may execute production mutations. */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { verifyChildDispatch, verifyHumanApproval } from "./release/app";
import {
  assertVercelProject,
  validateEnvironmentGate,
  validateReviewedMainRules,
} from "./release/manifest";
import { loadCodeManifest } from "./release/code-manifest";
import { executeCodeRelease, type CodeProviders } from "./release/code-release";

import {
  checkCodeHealth,
  verifyHealthDomainAliases,
} from "./release/code-health";

const command = process.argv[2];
const manifest = loadCodeManifest(
  process.env.RELEASE_MANIFEST_PATH ?? "",
  process.env.RELEASE_MANIFEST_SHA256 ?? "",
  process.env.RELEASE_SHA ?? "",
);
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
async function request(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Read-only target verification failed (${response.status}); no response body logged`,
    );
  return response.json() as Promise<unknown>;
}
const ghBase = `https://api.github.com/repos/${required("GITHUB_REPOSITORY")}`;
async function githubGate() {
  await verifyChildDispatch(process.env);
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
  validateEnvironmentGate(environment, policies);
  validateReviewedMainRules(rules);
  const value = z
    .object({
      protected: z.literal(true),
      commit: z.object({ sha: z.string() }),
    })
    .parse(branch);
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
}
const query = `teamId=${encodeURIComponent(manifest.vercel.teamId)}`;
async function vercel(path: string) {
  return request(
    `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}${query}`,
    required("VERCEL_TOKEN"),
  );
}
const deploymentSchema = z.object({
  id: z.string(),
  url: z.string(),
  projectId: z.string(),
  target: z.string(),
  readyState: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
async function deployment(id: string) {
  return deploymentSchema.parse(
    await vercel(`/v13/deployments/${encodeURIComponent(id)}`),
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
    const r = schema.parse(
      await vercel(
        `/v6/deployments?projectId=${manifest.vercel.projectId}&target=production&limit=100${cursor === null ? "" : `&until=${cursor}`}`,
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
  await githubGate();
  await verifyHumanApproval(process.env);
  const project = await vercel(`/v9/projects/${manifest.vercel.projectId}`);
  const current = assertVercelProject(project, manifest);
  const hooks = z.object({ link: z.null() }).passthrough().parse(project);
  const record = hooks as Record<string, unknown>;
  if (Array.isArray(record.deployHooks) && record.deployHooks.length)
    throw new Error("code.deploy-hooks-present");
  if (!current || !allowed.includes(current))
    throw new Error("code.production-drift");
  verifyHealthDomainAliases(
    await Promise.all(
      ["tullyelly.com", "www.tullyelly.com"].map((host) =>
        vercel(`/v4/aliases/${host}`),
      ),
    ),
    manifest.vercel.projectId,
    current,
  );
  if (
    (await deploymentHistory()).some((d) =>
      ["QUEUED", "BUILDING", "INITIALIZING"].includes(d.readyState),
    )
  )
    throw new Error("code.concurrent-deployment");
  // Metadata only. Never request decrypted values, DB URLs, cron secrets or Neon APIs.
  const env = z
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
    .parse(await vercel(`/v10/projects/${manifest.vercel.projectId}/env`));
  if (env.pagination?.next)
    throw new Error("code.incomplete-environment-metadata");
  if (
    env.envs.filter(
      (e) => e.key === "DATABASE_URL" && e.target?.includes("production"),
    ).length !== 1
  )
    throw new Error("code.runtime-database-configuration");
  return current;
}
function cli(args: string[]) {
  // Do not pass GitHub, App or build-only variables to the deployment process.
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    CI: "true",
    NO_UPDATE_NOTIFIER: "1",
    VERCEL_TOKEN: required("VERCEL_TOKEN"),
    VERCEL_TELEMETRY_DISABLED: "1",
  };
  const r = spawnSync(
    "vercel",
    [...args, "--non-interactive", "--scope", manifest.vercel.teamId],
    { encoding: "utf8", env, timeout: 900000, maxBuffer: 1024 * 1024 },
  );
  if (r.status !== 0 || r.error)
    throw new Error("code.provider-operation-unresolved");
  return r.stdout.trim();
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
      `Code-only ${manifest.operation}; SHA ${manifest.commit}; schema evidence ${manifest.schemaCompatibility.evidenceUrl}`,
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
    const r = spawnSync(
      "python3",
      ["scripts/release/code-build-context.py", "."],
      {
        stdio: "inherit",
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
    if (r.status !== 0 || r.error) throw new Error("code.build-failed");
    execFileSync(
      "python3",
      ["scripts/release/code-artifact.py", "verify", ".vercel/output"],
      { stdio: "inherit" },
    );
    return;
  }
  if (
    process.env.RELEASE_PRODUCTION_APPROVED !== "true" ||
    process.env.GITHUB_ACTIONS !== "true"
  )
    throw new Error("code.human-gate-required");
  await guard([manifest.vercel.productionDeploymentId]);
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
    async stage() {
      const output = cli([
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
      ]);
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
      cli(["promote", id, "--yes"]);
    },
    async rollback(id) {
      cli(["rollback", id, "--yes"]);
    },
  };
  const id = await executeCodeRelease(
    manifest,
    required("RELEASE_MANIFEST_SHA256"),
    manifest.operation === "deploy" ? required("RELEASE_BUILD_SHA256") : "",
    providers,
  );
  console.log(
    `Verified code-only ${manifest.operation}: ${id}; analytics remains disabled`,
  );
}
main().catch((error) => {
  const invariant =
    error instanceof Error && /^code\.[a-z0-9-]+$/.test(error.message)
      ? error.message
      : "code.validation-or-provider-failed";
  console.error(
    `Release stopped at ${invariant}; credentials and provider payloads omitted. Inspect remote state before another operation. No automatic recovery.`,
  );
  process.exitCode = 1;
});
