/** Read-only preparation; no deploy credential, production build or secret retrieval. */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import { githubApi, verifyChildDispatch } from "./app";
import {
  codeGuard,
  codeMetadataRequest,
  missingConfiguration,
} from "./code-diagnostics";
import { assertVercelProject, settingsDigest, sha256 } from "./manifest";
import { reportCodeEvent, reportCodeFailure } from "./code-report";
import { sourceArchiveDigest } from "./code-source";
import { planPublicationChecks } from "./code-publication-plan";
import {
  blockingCompatibilityRisks,
  configurationEvidence,
  changedCompatibility,
  nativeEvidenceSchema,
  nativeSettingsSchema,
  trustedRequiredCi,
} from "./native-evidence";

const required = (key: string) => {
  const value = process.env[key];
  if (!value) throw missingConfiguration(key);
  return value;
};
const projectId = "prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU",
  teamId = "team_pB5TcLa7apLtPAiVrRbcjBG3";
async function main() {
  const commit = z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .parse(required("RELEASE_SHA"));
  if (commit !== required("GITHUB_SHA"))
    throw new Error("code.evidence-revision");
  await codeGuard("github.child-dispatch", () =>
    verifyChildDispatch(process.env),
  );
  const ci = await trustedRequiredCi(commit, required("GH_TOKEN"), githubApi);
  // Token exists only in this reviewed GET-only provider step; dependencies installed earlier.
  const token = required("VERCEL_RELEASE_READ_TOKEN");
  delete process.env.VERCEL_RELEASE_READ_TOKEN;
  const read = (path: string) =>
    codeMetadataRequest(
      `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${teamId}`,
      token,
    );
  const [rawProject, environment] = await Promise.all([
    read(`/v9/projects/${projectId}`),
    read(`/v10/projects/${projectId}/env`),
  ]);
  const project = z.record(z.string(), z.unknown()).parse(rawProject);
  const settings = nativeSettingsSchema.parse(
    Object.fromEntries(
      Object.keys(nativeSettingsSchema.shape).map((key) => [
        key,
        project[key] ?? null,
      ]),
    ),
  );
  const id = z
    .object({
      targets: z.object({
        production: z.object({ id: z.string().regex(/^dpl_[A-Za-z0-9]+$/) }),
      }),
    })
    .parse(project).targets.production.id;
  const vercel = {
    projectId,
    teamId,
    productionDeploymentId: id,
    productionHost: "tullyelly.com" as const,
    settings,
    settingsSha256: settingsDigest(settings),
  };
  assertVercelProject(project, { vercel });
  if (Array.isArray(project.deployHooks) && project.deployHooks.length)
    throw new Error("code.deploy-hooks-present");
  const deployment = z
    .object({
      id: z.string(),
      projectId: z.string(),
      target: z.string(),
      readyState: z.string(),
      meta: z.record(z.string(), z.unknown()),
    })
    .parse(await read(`/v13/deployments/${id}`));
  const applicationSha = z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .parse(
      deployment.meta.gitCommitSha ??
        deployment.meta.githubCommitSha ??
        deployment.meta.releaseSha,
    );
  if (
    deployment.id !== id ||
    deployment.projectId !== projectId ||
    deployment.target !== "production" ||
    deployment.readyState !== "READY"
  )
    throw new Error("code.previous-application-identity");
  // Baselines from the recovery era can report unknown in the application. The
  // authoritative provider revision is recorded; every newly staged app must
  // prove its exact revision through /api/__version before promotion.
  const aliases = await Promise.all(
    ["tullyelly.com", "www.tullyelly.com"].map((host) =>
      read(`/v4/aliases/${host}`),
    ),
  );
  for (const [index, value] of aliases.entries()) {
    const alias = z
      .object({
        alias: z.string(),
        projectId: z.string(),
        deploymentId: z.string(),
      })
      .parse(value);
    if (
      alias.alias !== ["tullyelly.com", "www.tullyelly.com"][index] ||
      alias.projectId !== projectId ||
      alias.deploymentId !== id
    )
      throw new Error("code.domain-drift");
  }
  const compatibility = changedCompatibility(applicationSha, commit);
  const evidence = nativeEvidenceSchema.parse({
    version: 3,
    kind: "native-source",
    operation: "deploy",
    commit,
    collectionEnabled: false,
    workflow: {
      sha: required("GITHUB_SHA"),
      runId: required("GITHUB_RUN_ID"),
      runAttempt: required("GITHUB_RUN_ATTEMPT"),
    },
    source: { sha256: sourceArchiveDigest(commit) },
    ci,
    vercel,
    baseline: { applicationSha },
    config: configurationEvidence(project, environment),
    compatibility,
    publication: planPublicationChecks(applicationSha, commit),
  });
  const bytes = JSON.stringify(evidence, null, 2) + "\n",
    evidenceSha256 = sha256(bytes);
  mkdirSync(".cache", { recursive: true });
  writeFileSync(
    process.env.RELEASE_EVIDENCE_PATH ?? ".cache/release-evidence.json",
    bytes,
  );
  reportCodeEvent({
    event: "context",
    revision: commit,
    targetRevision: commit,
    operation: "deploy",
    evidenceSha256,
    sourceSha256: evidence.source.sha256,
    settingsSha256: vercel.settingsSha256,
    previousDeployment: id,
    ciRunId: ci.runId,
    workflowRunId: evidence.workflow.runId,
    workflowRunAttempt: evidence.workflow.runAttempt,
    workflowRevision: evidence.workflow.sha,
    compatibilityRisks: compatibility.risks,
    changedPaths: compatibility.changedPaths,
  });
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `evidence_sha256=${evidenceSha256}\n`,
    );
  console.log(
    `Native source release evidence ${evidenceSha256}; exact successful CI run ${ci.runId}; baseline ${id}.`,
  );
  if (blockingCompatibilityRisks(compatibility.risks).length)
    throw new Error("code.sensitive-compatibility-review");
  // Prove the evidence source matches the checked-out immutable tree. Generated
  // dependency files in this preparation checkout are never uploaded to Vercel.
  if (
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !==
    commit
  )
    throw new Error("code.application-sha");
}
main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "code-release-evidence-failure",
      ...reportCodeFailure("production.check", error),
    }),
  );
  process.exitCode = 1;
});
