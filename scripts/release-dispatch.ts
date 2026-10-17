/** Dispatch-only credential scope; this program cannot approve a deployment gate. */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { z } from "zod";
import {
  appConfiguration,
  githubApi,
  RELEASE_REPOSITORY,
  RELEASE_REPOSITORY_ID,
  validateDispatchEnvironment,
  verifyProtectedMain,
  withInstallationToken,
  type Api,
  type AppConfiguration,
} from "./release/app";
import { loadCodeManifest } from "./release/code-manifest";
import { loadMaintenanceManifest } from "./release/maintenance";
import { loadReleaseManifest } from "./release/manifest";
import { reviewBranchSchema } from "./release/review-branch";

export const dispatchInputSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("smoke"),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
    })
    .strict(),
  z
    .object({
      mode: z.literal("production"),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
    })
    .strict(),
  z
    .object({
      mode: z.literal("rollback"),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
      manifestPath: z.string().regex(/^releases\/[a-z0-9-]+\.json$/),
      manifestSha256: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({
      mode: z.literal("analytics"),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
      manifestPath: z.string().regex(/^releases\/[a-z0-9-]+\.json$/),
      manifestSha256: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({
      mode: z.literal("maintenance"),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
      manifestPath: z.string().regex(/^maintenance\/[a-z0-9-]+\.json$/),
      manifestSha256: z.string().regex(/^[a-f0-9]{64}$/),
      action: z.enum(["rotate", "recover"]),
    })
    .strict(),
  z
    .object({
      mode: z.literal("draft-pr"),
      branch: reviewBranchSchema,
      body: z.string().trim().min(1).max(60000).optional(),
      draft: z.boolean().optional(),
      sha: z.string().regex(/^[a-f0-9]{40}$/),
      title: z
        .string()
        .min(1)
        .max(200)
        .regex(/^[^\r\n\u0000-\u001f]+$/),
    })
    .strict(),
]);
export type DispatchInput = z.infer<typeof dispatchInputSchema>;
export function dispatchPayload(
  input: DispatchInput,
  configuration: AppConfiguration,
  parentRunId: string,
) {
  if (input.mode === "draft-pr")
    throw new Error("Draft pull requests do not dispatch release workflows");
  const id = z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .parse(parentRunId);
  return {
    workflow:
      input.mode === "smoke"
        ? "release-gate-smoke.yml"
        : input.mode === "maintenance"
          ? "credential-maintenance.yml"
          : input.mode === "analytics"
            ? "analytics-release.yml"
            : input.mode === "rollback"
              ? "production-rollback.yml"
              : "production-release.yml",
    body: {
      ref: "main",
      inputs: {
        release_sha: input.sha,
        dispatch_run_id: id,
        dispatch_installation_id: configuration.installationId,
        ...(input.mode === "maintenance" ||
        input.mode === "analytics" ||
        input.mode === "rollback"
          ? {
              manifest_path: input.manifestPath,
              manifest_sha256: input.manifestSha256,
              ...(input.mode === "maintenance"
                ? { maintenance_action: input.action }
                : {}),
            }
          : {}),
      },
    },
  };
}
const prSchema = z.object({
  number: z.number().int(),
  html_url: z.string().url(),
  draft: z.boolean(),
  user: z.object({ id: z.number(), login: z.string(), type: z.string() }),
  head: z.object({
    sha: z.string(),
    ref: z.string(),
    repo: z.object({ id: z.number() }),
  }),
  base: z.object({ ref: z.string(), repo: z.object({ id: z.number() }) }),
});
export async function prepareDraftPr(
  input: Extract<DispatchInput, { mode: "draft-pr" }>,
  configuration: AppConfiguration,
  token: string,
  api: Api = githubApi,
) {
  const workingBranch = reviewBranchSchema.parse(input.branch);
  const base = `/repos/${RELEASE_REPOSITORY}`;
  const head = z
    .object({ object: z.object({ sha: z.string() }) })
    .parse(await api(`${base}/git/ref/heads/${workingBranch}`, token));
  if (head.object.sha !== input.sha)
    throw new Error(
      "Published review branch does not match the exact prepared commit; no push attempted",
    );
  const existing = z
    .array(prSchema)
    .parse(
      await api(
        `${base}/pulls?state=open&head=tullyelly:${workingBranch}&base=main&per_page=100`,
        token,
      ),
    );
  if (existing.length > 1)
    throw new Error("Multiple review pull requests exist; stop for review");
  const body =
    input.body ??
    [
      "Reviewed working branch: " + workingBranch,
      "Exact review commit: " + input.sha,
      "Review publication does not authorize merging or a production release.",
    ].join("\n\n");
  const current = existing[0];
  const expectedDraft = current?.draft ?? input.draft ?? true;
  let result: unknown;
  if (existing.length) {
    if (
      String(current.user.id) !== configuration.botUserId ||
      current.user.login !== `${configuration.slug}[bot]` ||
      current.user.type !== "Bot" ||
      current.head.sha !== input.sha ||
      current.head.ref !== workingBranch ||
      current.head.repo.id !== RELEASE_REPOSITORY_ID ||
      current.base.ref !== "main" ||
      current.base.repo.id !== RELEASE_REPOSITORY_ID
    )
      throw new Error(
        "Existing pull request is not App-owned at the exact reviewed branch and commit; refusing to overwrite it",
      );
    result = await api(`${base}/pulls/${current.number}`, token, "PATCH", {
      title: input.title,
      body,
    });
  } else {
    result = await api(`${base}/pulls`, token, "POST", {
      title: input.title,
      head: workingBranch,
      base: "main",
      body,
      draft: expectedDraft,
      maintainer_can_modify: false,
    });
  }
  const created = prSchema.parse(result);
  if (
    created.html_url !==
      `https://github.com/${RELEASE_REPOSITORY}/pull/${created.number}` ||
    created.draft !== expectedDraft ||
    created.user.type !== "Bot" ||
    created.head.ref !== workingBranch ||
    created.base.ref !== "main" ||
    String(created.user.id) !== configuration.botUserId ||
    created.user.login !== `${configuration.slug}[bot]` ||
    created.head.sha !== input.sha ||
    created.head.repo.id !== RELEASE_REPOSITORY_ID ||
    created.base.repo.id !== RELEASE_REPOSITORY_ID
  )
    throw new Error(
      "Pull request identity did not match the App-owned reviewed branch",
    );
  return created.html_url;
}
async function main() {
  const configuration = appConfiguration(process.env);
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GITHUB_REF !== "refs/heads/main" ||
    process.env.GITHUB_EVENT_NAME !== "workflow_dispatch"
  )
    throw new Error("The App dispatcher runs only from reviewed main");
  const mode = process.env.RELEASE_DISPATCH_MODE;
  const input = dispatchInputSchema.parse(
    mode === "maintenance" || mode === "analytics" || mode === "rollback"
      ? {
          mode,
          sha: process.env.RELEASE_SHA,
          manifestPath: process.env.MANIFEST_SOURCE,
          manifestSha256: process.env.RELEASE_MANIFEST_SHA256,
          ...(mode === "maintenance"
            ? { action: process.env.MAINTENANCE_ACTION }
            : {}),
        }
      : mode === "draft-pr"
        ? {
            mode,
            sha: process.env.RELEASE_SHA,
            title: process.env.RELEASE_PR_TITLE,
            branch: process.env.RELEASE_REVIEW_BRANCH,
            body: process.env.RELEASE_PR_BODY || undefined,
          }
        : { mode, sha: process.env.RELEASE_SHA },
  );
  const token = z.string().min(1).parse(process.env.GH_TOKEN),
    workflowSha = z
      .string()
      .regex(/^[a-f0-9]{40}$/)
      .parse(process.env.GITHUB_SHA);
  const base = `/repos/${RELEASE_REPOSITORY}`;
  await verifyProtectedMain(token, workflowSha);
  const [environment, policies, repository] = await Promise.all([
    githubApi(`${base}/environments/release-dispatch`, token),
    githubApi(
      `${base}/environments/release-dispatch/deployment-branch-policies`,
      token,
    ),
    githubApi(base, token),
  ]);
  validateDispatchEnvironment(environment, policies);
  if (
    z.object({ id: z.number(), full_name: z.string() }).parse(repository).id !==
    RELEASE_REPOSITORY_ID
  )
    throw new Error("Repository ID mismatch");
  if (input.mode === "smoke" && input.sha !== workflowSha)
    throw new Error(
      "Harmless gate smoke must use the current protected main commit",
    );
  if (input.mode === "maintenance") {
    const manifest = loadMaintenanceManifest(
      input.manifestPath,
      input.manifestSha256,
      input.sha,
    );
    if (Boolean(manifest.recovery) !== (input.action === "recover"))
      throw new Error("Maintenance recovery mismatch");
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      input.sha,
      workflowSha,
    ]);
    const changed = execFileSync(
      "git",
      ["diff", "--name-only", input.sha, workflowSha],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    if (changed.some((path) => !/^maintenance\/[a-z0-9-]+\.json$/.test(path)))
      throw new Error("Maintenance executor differs from reviewed source");
  }
  if (input.mode === "production" && input.sha !== workflowSha)
    throw new Error(
      "Ordinary production requires the current reviewed main SHA",
    );
  if (input.mode === "analytics" || input.mode === "rollback") {
    if (input.mode === "rollback") {
      const manifest = loadCodeManifest(
        input.manifestPath,
        input.manifestSha256,
        input.sha,
      );
      if (manifest.operation !== "rollback")
        throw new Error(
          "Rollback dispatch requires an explicitly reviewed rollback manifest",
        );
    } else
      loadReleaseManifest(input.manifestPath, input.manifestSha256, input.sha);
    execFileSync("git", [
      "merge-base",
      "--is-ancestor",
      input.sha,
      workflowSha,
    ]);
    const changes = execFileSync(
      "git",
      ["diff", "--name-only", input.sha, workflowSha],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    if (changes.some((path) => !/^releases\/[a-z0-9-]+\.json$/.test(path)))
      throw new Error(
        "Production source differs from reviewed dispatcher code",
      );
  }
  const key = z.string().min(1).parse(process.env.RELEASE_APP_PRIVATE_KEY);
  const message = await withInstallationToken(
    configuration,
    key,
    input.mode,
    async (installationToken) => {
      if (input.mode === "draft-pr")
        return `App-owned review PR: ${await prepareDraftPr(input, configuration, installationToken)}`;
      const payload = dispatchPayload(
        input,
        configuration,
        z.string().min(1).parse(process.env.GITHUB_RUN_ID),
      );
      await githubApi(
        `${base}/actions/workflows/${payload.workflow}/dispatches`,
        installationToken,
        "POST",
        payload.body,
      );
      return `${input.mode === "smoke" ? "Harmless release gate smoke" : input.mode === "maintenance" ? "Credential maintenance preparation" : "Production release preparation"} dispatched by ${configuration.slug}[bot] for ${input.sha}. Human approval remains required. Inspect GitHub > Actions > ${input.mode === "smoke" ? "Release approval gate smoke" : input.mode === "maintenance" ? "Protected credential maintenance" : input.mode === "analytics" ? "Approved analytics release (explicit only)" : input.mode === "rollback" ? "Approved production rollback" : "Native source production release"} > Review deployments > production-release. No gate was approved automatically.`;
    },
  );
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
// Importing this file for fixtures never executes authentication or network requests.
if (process.argv[1]?.endsWith("release-dispatch.ts"))
  main().catch(() => {
    console.error(
      "App dispatch stopped. Check protected refs, App identity/installation, narrowly scoped permissions and prepared inputs. No gate was approved; no token or private key is logged. Do not automatically retry an ambiguous dispatch.",
    );
    process.exitCode = 1;
  });
