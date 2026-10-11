/** Entry point is restricted to the App-dispatched protected workflow; never run locally for production. */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";
import {
  appConfiguration,
  githubApi,
  verifyAppRun,
  verifyChildDispatch,
  verifyHumanApproval,
  RELEASE_REPOSITORY,
} from "./release/app";
import {
  loadMaintenanceManifest,
  executeMaintenance,
  MaintenanceFailure,
} from "./release/maintenance";
import { createMaintenanceProviders } from "./release/maintenance-providers";
const required = (name: string) => z.string().min(1).parse(process.env[name]);
async function main() {
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GITHUB_REF !== "refs/heads/main" ||
    process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
    process.env.RELEASE_CHILD_WORKFLOW !==
      ".github/workflows/credential-maintenance.yml"
  )
    throw new Error("maintenance.workflow-context");
  const manifestPath = required("MANIFEST_SOURCE"),
    checksum = required("RELEASE_MANIFEST_SHA256"),
    executor = required("RELEASE_SHA");
  const manifest = loadMaintenanceManifest(manifestPath, checksum, executor);
  const action = z
    .enum(["rotate", "recover"])
    .parse(process.env.MAINTENANCE_ACTION);
  if (Boolean(manifest.recovery) !== (action === "recover"))
    throw new Error("maintenance.recovery-action");
  if (
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !==
    executor
  )
    throw new Error("maintenance.executor-checkout");
  await verifyChildDispatch(process.env);
  execFileSync("git", [
    "merge-base",
    "--is-ancestor",
    executor,
    required("GITHUB_SHA"),
  ]);
  const changes = execFileSync(
    "git",
    ["diff", "--name-only", executor, required("GITHUB_SHA")],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  if (changes.some((p) => !/^maintenance\/[a-z0-9-]+\.json$/.test(p)))
    throw new Error("maintenance.executor-drift");
  execFileSync("git", [
    "merge-base",
    "--is-ancestor",
    manifest.applicationSha,
    executor,
  ]);
  if (process.argv[2] === "prepare") {
    if (manifest.recovery) {
      const r = await githubApi(
        `/repos/${RELEASE_REPOSITORY}/actions/runs/${manifest.recovery.originalRunId}`,
        required("GH_TOKEN"),
      );
      const run = z
        .object({
          path: z.literal(".github/workflows/credential-maintenance.yml"),
          head_sha: z.string(),
        })
        .parse(r);
      verifyAppRun(r, appConfiguration(process.env), run.head_sha);
    }
    const directory = required("APPLICATION_DIRECTORY");
    mkdirSync(`${directory}/.vercel`, { recursive: true });
    writeFileSync(
      `${directory}/.vercel/project.json`,
      JSON.stringify({
        orgId: manifest.vercel.teamId,
        projectId: manifest.vercel.projectId,
        settings: manifest.vercel.settings,
      }),
    );
    writeFileSync(`${directory}/.vercel/.env.production.local`, "");
    const output = required("GITHUB_OUTPUT");
    appendFileSync(
      output,
      `application_sha=${manifest.applicationSha}\nrecovery_run=${manifest.recovery?.originalRunId ?? ""}\nrecovery_build=${manifest.recovery?.buildSha256 ?? ""}\n`,
    );
    console.log(
      `Credential-free preparation: executor ${executor}; application ${manifest.applicationSha}; action ${action}. No migration or ledger operations.`,
    );
    return;
  }
  if (
    process.argv[2] !== "execute" ||
    process.env.MAINTENANCE_PRODUCTION_APPROVED !== "true"
  )
    throw new Error("maintenance.execution-context");
  await verifyHumanApproval(process.env);
  const providers = createMaintenanceProviders(manifest, {
    neonToken: required("NEON_CREDENTIAL_MAINTENANCE_API_KEY"),
    vercelToken: required("VERCEL_TOKEN"),
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    directory: required("APPLICATION_DIRECTORY"),
  });
  const guarded = providers.guard;
  providers.guard = async (allowed) => {
    await verifyChildDispatch(process.env);
    await verifyHumanApproval(process.env);
    return guarded(allowed);
  };
  const state = await executeMaintenance(
    manifest,
    {
      manifestSha256: checksum,
      buildSha256: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(process.env.MAINTENANCE_BUILD_SHA256),
      runId: required("GITHUB_RUN_ID"),
      workflowSha: required("GITHUB_SHA"),
      action,
    },
    providers,
  );
  console.log(
    JSON.stringify({
      operationId: manifest.operationId,
      phase: state.phase,
      deploymentId: state.deploymentId,
      applicationSha: manifest.applicationSha,
      oldCredentialRejected: state.oldRejected,
      githubSecretSynchronization:
        "human action required; no GitHub secrets were modified",
    }),
  );
}
if (process.argv[1]?.endsWith("credential-maintenance.ts"))
  main().catch((error: unknown) => {
    console.error(
      JSON.stringify({
        event: "credential-maintenance",
        status: "stopped",
        boundary:
          error instanceof MaintenanceFailure
            ? error.boundary
            : "workflow-or-manifest-guard",
        nextAction:
          "inspect provider state and durable journal; no automatic mutation retry or old-password recovery",
      }),
    );
    process.exitCode = 1;
  });
