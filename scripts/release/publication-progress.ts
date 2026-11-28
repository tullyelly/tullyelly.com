/** One coordinator, existing dispatcher, read-only reconnect; no gate approval or retry. */
import { z } from "zod";
import { RELEASE_REPOSITORY, RELEASE_REPOSITORY_ID, type Api } from "./app";

export const publicationRunSchema = z.object({
  id: z.number().int().positive(),
  run_attempt: z.number().int().positive(),
  head_sha: z.string().regex(/^[a-f0-9]{40}$/),
  head_branch: z.string(),
  path: z.string(),
  event: z.string(),
  status: z.string(),
  conclusion: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  head_repository: z.object({ id: z.number(), full_name: z.string() }),
  display_title: z.string().optional(),
});
export type PublicationRun = z.infer<typeof publicationRunSchema>;
export type PublicationReceipt = {
  deployment: string;
  publicVerified: boolean;
};
export type PublicationProgress = {
  state:
    | "needs-merge"
    | "checking"
    | "ready"
    | "dispatched"
    | "dispatch-unconfirmed"
    | "running"
    | "approval"
    | "failed"
    | "verified"
    | "public-verification-pending"
    | "receipt-unavailable";
  sha: string;
  url?: string;
  deployment?: string;
  elapsedSeconds?: number;
};
export async function publicationProgress(options: {
  mode: "publish" | "status";
  sha: string;
  token: string;
  api: Api;
  hasIntent: () => boolean;
  recordIntent: () => void;
  receipt: (run: PublicationRun) => Promise<PublicationReceipt | undefined>;
}): Promise<PublicationProgress> {
  const { sha, api, token } = options;
  if (!/^[a-f0-9]{40}$/.test(sha))
    throw new Error("Expected exact publication SHA");
  const base = `/repos/${RELEASE_REPOSITORY}`;
  const runs = async (workflow: string) => {
    const result = z
      .object({
        total_count: z.number().max(100),
        workflow_runs: z.array(publicationRunSchema),
      })
      .parse(
        await api(
          `${base}/actions/workflows/${workflow}/runs?head_sha=${sha}&event=workflow_dispatch&per_page=100`,
          token,
        ),
      );
    return result.workflow_runs
      .filter(
        (r) =>
          r.head_sha === sha &&
          r.head_branch === "main" &&
          r.path === `.github/workflows/${workflow}` &&
          r.event === "workflow_dispatch" &&
          r.head_repository.id === RELEASE_REPOSITORY_ID &&
          r.head_repository.full_name === RELEASE_REPOSITORY,
      )
      .sort((a, b) => b.id - a.id);
  };
  const [parents, children] = await Promise.all([
    runs("release-dispatch.yml"),
    runs("production-release.yml"),
  ]);
  const child = children[0],
    parent = parents.find(
      (run) => run.display_title === `App dispatch production at ${sha}`,
    );
  const run = child ?? parent;
  const result = (
    state: PublicationProgress["state"],
  ): PublicationProgress => ({
    state,
    sha,
    ...(run
      ? {
          url: `https://github.com/${RELEASE_REPOSITORY}/actions/runs/${run.id}`,
          elapsedSeconds: Math.max(
            0,
            Math.round(
              (Date.parse(
                run.status === "completed"
                  ? run.updated_at
                  : new Date().toISOString(),
              ) -
                Date.parse(parent?.created_at ?? run.created_at)) /
                1000,
            ),
          ),
        }
      : {}),
  });
  if (child) {
    if (child.status !== "completed") {
      const jobs = z
        .object({
          total_count: z.number().max(100),
          jobs: z.array(z.object({ name: z.string(), status: z.string() })),
        })
        .parse(
          await api(
            `${base}/actions/runs/${child.id}/attempts/${child.run_attempt}/jobs?per_page=100`,
            token,
          ),
        );
      const prepared = jobs.jobs.some(
        (j) => j.name === "prepare" && j.status === "completed",
      );
      const protectedJob = jobs.jobs.find((j) => j.name === "production");
      return result(
        prepared &&
          (!protectedJob ||
            ["waiting", "pending"].includes(protectedJob.status))
          ? "approval"
          : "running",
      );
    }
    if (child.conclusion !== "success") return result("failed");
    const receipt = await options.receipt(child);
    if (!receipt) return result("receipt-unavailable");
    return {
      ...result(
        receipt.publicVerified ? "verified" : "public-verification-pending",
      ),
      deployment: receipt.deployment,
    };
  }
  if (parent)
    return result(
      parent.status === "completed" && parent.conclusion !== "success"
        ? "failed"
        : "dispatched",
    );
  if (options.hasIntent()) return result("dispatch-unconfirmed");
  const main = z
    .object({ commit: z.object({ sha: z.string() }) })
    .parse(await api(`${base}/branches/main`, token));
  if (main.commit.sha !== sha) return result("needs-merge");
  const ci = z
    .object({ workflow_runs: z.array(publicationRunSchema) })
    .parse(
      await api(
        `${base}/actions/workflows/ci.yml/runs?head_sha=${sha}&event=push&per_page=100`,
        token,
      ),
    );
  const matchingCi = ci.workflow_runs
    .filter(
      (r) =>
        r.head_sha === sha &&
        r.head_branch === "main" &&
        r.event === "push" &&
        r.path === ".github/workflows/ci.yml" &&
        r.head_repository.id === RELEASE_REPOSITORY_ID &&
        r.head_repository.full_name === RELEASE_REPOSITORY,
    )
    .sort((a, b) => b.id - a.id)[0];
  if (!matchingCi || matchingCi.status !== "completed")
    return result("checking");
  if (matchingCi.conclusion !== "success")
    return {
      ...result("failed"),
      url: `https://github.com/${RELEASE_REPOSITORY}/actions/runs/${matchingCi.id}`,
    };
  if (options.mode === "status") return result("ready");
  options.recordIntent(); // Durable before the only write; ambiguity never triggers a blind retry.
  await api(
    `${base}/actions/workflows/release-dispatch.yml/dispatches`,
    token,
    "POST",
    { ref: "main", inputs: { mode: "production", release_sha: sha } },
  );
  return result("dispatched");
}
