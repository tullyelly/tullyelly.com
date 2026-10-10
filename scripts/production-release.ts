/** Only the protected workflow may authorize production mutations. Never run locally to bypass its gate. */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { verifyChildDispatch, verifyHumanApproval } from "./release/app";
import {
  assertVercelProject,
  loadReleaseManifest,
  validateEnvironmentGate,
  validateReviewedMainRules,
  verifyRuntimeDatabase,
  verifyPreviewDatabases,
  verifyReleaseDeploymentIdentity,
} from "./release/manifest";

const command = process.argv[2];
const manifest = loadReleaseManifest(
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
const vcBase = `https://api.vercel.com`;
const vcQuery = `teamId=${encodeURIComponent(manifest.vercel.teamId)}`;
async function vercel(path: string) {
  return request(
    `${vcBase}${path}${path.includes("?") ? "&" : "?"}${vcQuery}`,
    required("VERCEL_TOKEN"),
  );
}
async function deployment(id: string) {
  return z
    .object({
      id: z.string(),
      url: z.string(),
      projectId: z.string(),
      target: z.literal("production"),
      readyState: z.string(),
      meta: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough()
    .parse(await vercel(`/v13/deployments/${encodeURIComponent(id)}`));
}
async function releaseDeployment() {
  const result = z
    .object({
      deployments: z.array(
        z.object({
          uid: z.string(),
          meta: z.record(z.string(), z.unknown()).optional(),
        }),
      ),
      pagination: z.object({ next: z.number().nullable() }),
    })
    .parse(
      await vercel(
        `/v6/deployments?projectId=${manifest.vercel.projectId}&target=production&limit=100`,
      ),
    );
  const matches = result.deployments.filter(
    (d) =>
      d.meta?.releaseSha === manifest.commit &&
      d.meta?.releaseManifest === process.env.RELEASE_MANIFEST_SHA256,
  );
  if (matches.length > 1)
    throw new Error("Multiple deployments match this release; stop for review");
  if (matches.length === 1) {
    if (
      matches[0].meta?.releaseBuildSha256 !== required("RELEASE_BUILD_SHA256")
    )
      throw new Error(
        "Existing staged deployment has different approved build bytes; stop for a revised release",
      );
    return deployment(matches[0].uid);
  }
  if (result.pagination.next !== null)
    throw new Error(
      "Deployment history exceeds the reviewed lookup window; resolve rerun identity before creating a deployment",
    );
  return undefined;
}
async function liveTargets() {
  await githubGate();
  await verifyHumanApproval(process.env);
  const project = await vercel(`/v9/projects/${manifest.vercel.projectId}`);
  const current = assertVercelProject(project, manifest);
  const matching = await releaseDeployment();
  if (
    current !== manifest.vercel.productionDeploymentId &&
    current !== matching?.id
  )
    throw new Error("Production deployment drift; prepare a revised release");
  const domains = z
    .object({
      domains: z.array(z.object({ name: z.string(), verified: z.boolean() })),
      pagination: z.object({ next: z.number().nullable() }).optional(),
    })
    .parse(await vercel(`/v9/projects/${manifest.vercel.projectId}/domains`));
  if (
    !domains.domains.some(
      (d) => d.name === manifest.vercel.productionHost && d.verified,
    )
  )
    throw new Error("Expected verified production domain is not attached");
  // Disconnecting the Git integration also disables its repository-bound Deploy Hooks.
  // The required null link is the verified live gate; no undocumented hooks endpoint is used.
  const endpoints = z
    .object({
      endpoints: z.array(
        z.object({ branch_id: z.string(), host: z.string(), type: z.string() }),
      ),
    })
    .parse(
      await request(
        `https://console.neon.tech/api/v2/projects/${encodeURIComponent(manifest.neon.projectId)}/endpoints`,
        required("NEON_API_KEY"),
      ),
    );
  if (
    !endpoints.endpoints.some(
      (e) =>
        e.branch_id === manifest.neon.branchId &&
        e.host === manifest.neon.host &&
        e.type === "read_write",
    )
  )
    throw new Error("Neon project/branch/direct endpoint mismatch");
  const branch = z
    .object({ branch: z.object({ id: z.string(), project_id: z.string() }) })
    .parse(
      await request(
        `https://console.neon.tech/api/v2/projects/${encodeURIComponent(manifest.neon.projectId)}/branches/${encodeURIComponent(manifest.neon.branchId)}`,
        required("NEON_API_KEY"),
      ),
    );
  if (
    branch.branch.id !== manifest.neon.branchId ||
    branch.branch.project_id !== manifest.neon.projectId
  )
    throw new Error("Neon branch identity mismatch");
  const url = new URL(required("RELEASE_DATABASE_URL"));
  if (
    url.hostname !== manifest.neon.host ||
    decodeURIComponent(url.pathname.slice(1)) !== manifest.neon.database ||
    decodeURIComponent(url.username) !== manifest.neon.role
  )
    throw new Error("Release database credentials target mismatch");
  const env = z
    .object({
      envs: z.array(
        z.object({
          id: z.string(),
          key: z.string(),
          target: z.array(z.string()).optional(),
          gitBranch: z.string().nullable().optional(),
        }),
      ),
      pagination: z.object({ next: z.number().nullable() }).optional(),
    })
    .parse(await vercel(`/v10/projects/${manifest.vercel.projectId}/env`));
  if (env.pagination?.next)
    throw new Error(
      "Environment coverage is paginated; cannot prove isolation",
    );
  // Metadata first, then retrieve only necessary release variables. Never decrypt/list unrelated secrets.
  const selected = env.envs.filter(
    (e) =>
      (e.target?.includes("production") &&
        ["DATABASE_URL", "ANALYTICS_SYNC_ENABLED", "CRON_SECRET"].includes(
          e.key,
        )) ||
      (e.target?.includes("preview") && e.key === "DATABASE_URL"),
  );
  const values = await Promise.all(
    selected.map(async (e) => ({
      ...e,
      value: z
        .object({ value: z.string() })
        .parse(
          await vercel(
            `/v1/projects/${manifest.vercel.projectId}/env/${encodeURIComponent(e.id)}`,
          ),
        ).value,
    })),
  );
  const production = values.filter((e) => e.target?.includes("production"));
  const db = production.filter((e) => e.key === "DATABASE_URL");
  if (db.length !== 1)
    throw new Error("Exactly one production DATABASE_URL is required");
  verifyRuntimeDatabase(db[0].value, manifest);
  const switchValues = production.filter(
    (e) => e.key === "ANALYTICS_SYNC_ENABLED",
  );
  if (switchValues.length > 1 || switchValues.some((e) => e.value !== "false"))
    throw new Error(
      "Production collection must be explicitly disabled during this release",
    );
  const preview = values.filter(
    (e) => e.target?.includes("preview") && e.key === "DATABASE_URL",
  );
  verifyPreviewDatabases(preview, manifest);
  return {
    current,
    matching,
    cronSecret: production.find((e) => e.key === "CRON_SECRET")?.value,
  };
}
function cli(args: string[]) {
  const result = spawnSync(
    "vercel",
    [...args, "--non-interactive", "--scope", manifest.vercel.teamId],
    { encoding: "utf8", env: process.env },
  );
  if (result.status !== 0)
    throw new Error(
      "Vercel execution failed; no token or command response logged",
    );
  return result.stdout.trim();
}
async function smoke(url: string, cronSecret: string | undefined) {
  if (!cronSecret) throw new Error("Production CRON_SECRET is missing");
  const base = new URL(url);
  if (
    base.protocol !== "https:" ||
    !(
      base.hostname.endsWith(".vercel.app") ||
      base.hostname === manifest.vercel.productionHost
    )
  )
    throw new Error("Unexpected deployment URL");
  const protection = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers: Record<string, string> = protection
    ? { "x-vercel-protection-bypass": protection }
    : {};
  for (const path of ["/stats", "/shaolin"]) {
    const response = await fetch(new URL(path, base), {
      headers,
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    if (response.status !== 200)
      throw new Error(`Read-only smoke failed: ${path} (${response.status})`);
    const body = await response.text();
    if (!body.includes("<!DOCTYPE html>") && !body.includes("<!doctype html>"))
      throw new Error("Smoke response is not an HTML page");
  }
  const unauthorized = await fetch(new URL("/api/cron/analytics", base), {
    headers,
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (unauthorized.status !== 401)
    throw new Error("Cron accepted an unauthenticated request");
  const admin = await fetch(new URL("/mark2/admin/analytics", base), {
    headers,
    signal: AbortSignal.timeout(15000),
    redirect: "manual",
  });
  if (![302, 303, 307, 308, 401, 403, 404].includes(admin.status))
    throw new Error("Owner administration is visible without authentication");
  if ([302, 303, 307, 308].includes(admin.status)) {
    const login = new URL(admin.headers.get("location") ?? "", base);
    if (
      login.origin !== base.origin ||
      !["/login", "/api/auth/signin"].includes(login.pathname)
    )
      throw new Error("Owner authorization redirect did not lead to login");
  }
  const response = await fetch(new URL("/api/cron/analytics", base), {
    headers: { ...headers, Authorization: `Bearer ${cronSecret}` },
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  const result = z
    .object({ status: z.literal("disabled") })
    .parse(await response.json());
  if (
    response.status !== 200 ||
    result.status !== "disabled" ||
    !response.headers.get("cache-control")?.includes("no-store")
  )
    throw new Error("Disabled cron smoke failed");
}
async function main() {
  if (command === "prepare") {
    await githubGate();
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
      `Release ${manifest.commit}; manifest ${process.env.RELEASE_MANIFEST_SHA256}; migrations ${manifest.migrations.map((m) => m.filename).join(", ")}`,
    );
    return;
  }
  if (
    process.env.RELEASE_PRODUCTION_APPROVED !== "true" ||
    process.env.GITHUB_ACTIONS !== "true"
  )
    throw new Error(
      "Production operations require the approved GitHub environment job",
    );
  const state = await liveTargets();
  if (command === "check") {
    console.log("Production targets, protection and drift checks passed");
    return;
  }
  if (command !== "deploy") throw new Error("Unsupported release command");
  let target = state.matching;
  if (!target) {
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
      `releaseManifest=${process.env.RELEASE_MANIFEST_SHA256}`,
      "--meta",
      "collectionDisabled=true",
      "--env",
      "ANALYTICS_SYNC_ENABLED=false",
    ]);
    // CLI stdout is a URL; no guessed parsing or automatic linking on errors.
    const url = new URL(output);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".vercel.app") ||
      url.origin !== output
    )
      throw new Error(
        "Unrecognized Vercel deployment result; stop and inspect deployment identity",
      );
    target = await deployment(url.hostname);
  }
  verifyReleaseDeploymentIdentity(
    target,
    manifest,
    required("RELEASE_MANIFEST_SHA256"),
    required("RELEASE_BUILD_SHA256"),
  );
  await smoke(`https://${target.url}`, state.cronSecret);
  const rechecked = await liveTargets();
  if (rechecked.current !== target.id) {
    cli(["promote", target.id, "--yes"]);
  }
  const promoted = await liveTargets();
  if (promoted.current !== target.id)
    throw new Error("Promotion did not assign the reviewed deployment");
  await smoke(`https://${manifest.vercel.productionHost}`, promoted.cronSecret);
  console.log(
    `Verified production deployment ${target.id}; collection remains disabled`,
  );
}
main().catch(() => {
  console.error(
    "Release stopped. Review target/approval/drift/schema or deployment evidence; no automatic rollback or database restore was attempted.",
  );
  process.exitCode = 1;
});
