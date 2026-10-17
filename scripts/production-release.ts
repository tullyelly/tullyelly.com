/** Only the App-dispatched protected workflow may execute production mutations. */
import { z } from "zod";
import { verifyChildDispatch, verifyHumanApproval } from "./release/app";
import {
  assertVercelProject,
  validateEnvironmentGate,
  validateReviewedMainRules,
} from "./release/manifest";
import {
  loadNativeEvidence,
  configurationEvidence,
  trustedRequiredCi,
  type NativeCodeEvidence,
} from "./release/native-evidence";
import { createCleanSource, sourceArchiveDigest } from "./release/code-source";
import { providerDiagnostic } from "./release/provider-diagnostic.mjs";
import { executeCodeRelease, type CodeProviders } from "./release/code-release";
import {
  codeCli,
  nativeSourceDeployArguments,
  stagedDeploymentUrl,
} from "./release/code-cli";
import { reportCodeEvent, reportCodeFailure } from "./release/code-report";
import { checkCodeAuth } from "./release/code-auth";

import {
  checkCodeHealth,
  readHealthResponse,
  verifyHealthDomainAliases,
} from "./release/code-health";
import {
  checkPublicationHealth,
  checkChangedPublicationHealth,
} from "./release/code-publication-health";

import {
  codeGuard,
  codeMetadataRequest,
  missingConfiguration,
} from "./release/code-diagnostics";

const command = process.argv[2];
let manifest: NativeCodeEvidence;
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
    if (
      manifest.commit !== required("GITHUB_SHA") ||
      manifest.workflow.sha !== required("GITHUB_SHA")
    )
      throw new Error("code.evidence-revision");
  });
  const ci = await trustedRequiredCi(
    manifest.commit,
    token,
    async (path, accessToken) =>
      request(`https://api.github.com${path}`, accessToken),
  );
  if (JSON.stringify(ci) !== JSON.stringify(manifest.ci))
    throw new Error("code.required-ci-unavailable");
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
  errorCode: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
});
async function deployment(id: string) {
  return codeGuard("vercel.deployment", async () => {
    const d = deploymentSchema.parse(
      await vercel(`/v13/deployments/${encodeURIComponent(id)}`),
    );
    return {
      ...d,
      providerError: providerDiagnostic(
        JSON.stringify({ error: { code: d.errorCode?.toLowerCase() } }),
        d.errorMessage,
        {
          secrets: [
            process.env.VERCEL_TOKEN,
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
            process.env.GH_TOKEN,
          ].filter((value): value is string => Boolean(value)),
        },
      ),
    };
  });
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
      d.meta?.releaseEvidence === required("RELEASE_EVIDENCE_SHA256") &&
      d.meta?.releaseRunId === manifest.workflow.runId &&
      d.meta?.releaseRunAttempt === manifest.workflow.runAttempt,
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
      (await deploymentHistory()).some(
        (d) =>
          ["QUEUED", "BUILDING", "INITIALIZING"].includes(d.readyState) &&
          !(
            d.meta?.releaseEvidence === required("RELEASE_EVIDENCE_SHA256") &&
            d.meta?.releaseRunId === manifest.workflow.runId &&
            d.meta?.releaseRunAttempt === manifest.workflow.runAttempt
          ),
      )
    )
      throw new Error("code.concurrent-deployment");
    // Metadata only. Never request decrypted values, DB URLs, cron secrets or Neon APIs.
    const env = await codeGuard("vercel.environment", () =>
      vercel(`/v10/projects/${manifest.vercel.projectId}/env`),
    );
    const config = configurationEvidence(project, env);
    if (JSON.stringify(config) !== JSON.stringify(manifest.config))
      throw new Error("code.configuration-drift");
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
    manifest.commit,
  );
  await checkChangedPublicationHealth(
    (path) =>
      readHealthResponse({
        stagedHost: d.url,
        publicDomain,
        path,
        publicOrigin: publicDomain ? "https://www.tullyelly.com" : undefined,
        bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        timeoutMs: 30000,
      }),
    manifest.publication,
  );
}
async function main() {
  manifest = await codeGuard("manifest.validation", () =>
    loadNativeEvidence(
      required("RELEASE_EVIDENCE_PATH"),
      required("RELEASE_EVIDENCE_SHA256"),
      required("RELEASE_SHA"),
    ),
  );
  reportCodeEvent({
    event: "context",
    revision: manifest.commit,
    operation: manifest.operation,
    evidenceSha256: required("RELEASE_EVIDENCE_SHA256"),
    sourceSha256: manifest.source.sha256,
    ciRunId: manifest.ci.runId,
    workflowRunId: manifest.workflow.runId,
    workflowRevision: manifest.workflow.sha,
    compatibilityRisks: manifest.compatibility.risks,
    changedPaths: manifest.compatibility.changedPaths,
    settingsSha256: manifest.vercel.settingsSha256,
    previousDeployment: manifest.vercel.productionDeploymentId,
    targetRevision: manifest.commit,
  });
  ghBase = `https://api.github.com/repos/${required("GITHUB_REPOSITORY")}`;
  query = `teamId=${encodeURIComponent(manifest.vercel.teamId)}`;
  if (command === "prepare") {
    await githubGate();
    if (sourceArchiveDigest(manifest.commit) !== manifest.source.sha256)
      throw new Error("code.source-digest");
    console.log(
      `Native source release; application SHA ${manifest.commit}; evidence SHA-256 ${required("RELEASE_EVIDENCE_SHA256")}`,
    );
    return;
  }
  if (
    process.env.RELEASE_PRODUCTION_APPROVED !== "true" ||
    process.env.GITHUB_ACTIONS !== "true"
  )
    throw new Error("code.human-gate-required");
  if (command === "auth") {
    // The preflight is a read-only operation inside the existing protected job.
    // Validate the App dispatch and recorded approval before exposing the token.
    await githubGate();
    await codeGuard("human.approval", () => verifyHumanApproval(process.env));
    await checkCodeAuth({
      token: process.env.VERCEL_TOKEN,
      projectId: manifest.vercel.projectId,
      teamId: manifest.vercel.teamId,
      report: reportCodeEvent,
    });
    return;
  }
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
      previous.meta?.releaseSha) !== manifest.baseline.applicationSha
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
    reportPhase(event) {
      reportCodeEvent({ event: "phase", ...event });
    },
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
      // Never upload the dependency-installed/generated validation directory.
      const source = createCleanSource({
        commit: manifest.commit,
        sha256: manifest.source.sha256,
        projectId: manifest.vercel.projectId,
        teamId: manifest.vercel.teamId,
        temporaryDirectory: required("RUNNER_TEMP"),
      });
      try {
        const output = codeCli(
          "vercel.stage",
          nativeSourceDeployArguments({
            projectId: manifest.vercel.projectId,
            commit: manifest.commit,
            evidenceDigest: required("RELEASE_EVIDENCE_SHA256"),
            sourceDigest: manifest.source.sha256,
            workflowRunId: manifest.workflow.runId,
            workflowRunAttempt: manifest.workflow.runAttempt,
          }),
          manifest.vercel.teamId,
          required("VERCEL_TOKEN"),
          undefined,
          { cwd: source.directory },
        );
        return deployment(stagedDeploymentUrl(output).hostname);
      } finally {
        source.dispose();
      }
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
    required("RELEASE_EVIDENCE_SHA256"),
    "",
    providers,
  );
  reportCodeEvent({ event: "deployment", deploymentId: id });
  console.log(
    `Verified native source ${manifest.operation}: ${id}; analytics remains disabled`,
  );
}
main().catch((error) => {
  const guard = "production.check";
  console.error(
    JSON.stringify({
      event: "code-release-failure",
      command: ["prepare", "check", "auth", "deploy"].includes(command)
        ? command
        : "unknown",
      ...reportCodeFailure(guard, error),
    }),
  );
  console.error(
    "Release stopped; diagnostics are bounded and credential-redacted. No automatic retry or recovery.",
  );
  process.exitCode = 1;
});
