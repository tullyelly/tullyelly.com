/** Read-only completion of a specific native release's public acceptance. */
import { z } from "zod";
import { RELEASE_REPOSITORY, RELEASE_REPOSITORY_ID } from "./app";
import { sha256 } from "./manifest";
import { validateNativeEvidence } from "./native-evidence";
import { verifyNativeDeploymentIdentity } from "./code-release";
import { verifyHealthDomainAliases } from "./code-health";
import { verifyAnalyticsRuntime } from "./analytics-intent";
import { checkApplicationHealth } from "./application-health";
import { classifyCodeFailure, codeMetadataRequest } from "./code-diagnostics";

const decimal = z.string().regex(/^[1-9][0-9]{0,14}$/);
export const publicVerificationInput = z
  .object({
    run: decimal,
    attempt: decimal,
    deployment: z.string().regex(/^dpl_[A-Za-z0-9]{1,80}$/),
    sha: z.string().regex(/^[a-f0-9]{40}$/),
    location: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,79}$/),
  })
  .strict();
export type PublicVerificationInput = z.infer<typeof publicVerificationInput>;

export async function verifyPublicRelease(
  supplied: PublicVerificationInput,
  evidenceBytes: string,
  options: {
    readToken?: string;
    githubToken?: string;
    fetcher?: typeof fetch;
  },
) {
  const input = publicVerificationInput.parse(supplied);
  if (
    [options.readToken, options.githubToken].some(
      (token) => token?.trim() && input.location.includes(token.trim()),
    )
  )
    throw new Error("code.public-verification-input");
  const binding = {
    ...input,
    execution: {
      location: input.location,
      platform: process.platform,
      architecture: process.arch,
      node: process.version,
    },
    startedAt: new Date().toISOString(),
  };
  try {
    if (!options.readToken?.trim())
      throw new Error("code.public-verification-credentials");
    if (Buffer.byteLength(evidenceBytes) > 1024 * 1024)
      throw new Error("code.public-verification-input");
    const evidence = validateNativeEvidence(JSON.parse(evidenceBytes));
    const evidenceDigest = sha256(Buffer.from(evidenceBytes));
    if (
      evidence.commit !== input.sha ||
      evidence.workflow.runId !== input.run ||
      evidence.workflow.runAttempt !== input.attempt
    )
      throw new Error("code.public-verification-binding");
    const run = z
      .object({
        id: z.number().int().positive(),
        run_attempt: z.number().int().positive(),
        path: z.literal(".github/workflows/production-release.yml"),
        event: z.literal("workflow_dispatch"),
        head_branch: z.literal("main"),
        head_sha: z.string(),
        status: z.literal("completed"),
        repository: z.object({
          id: z.literal(RELEASE_REPOSITORY_ID),
          full_name: z.literal(RELEASE_REPOSITORY),
        }),
      })
      .parse(
        await codeMetadataRequest(
          `https://api.github.com/repos/${RELEASE_REPOSITORY}/actions/runs/${input.run}/attempts/${input.attempt}`,
          options.githubToken,
          options.fetcher,
        ),
      );
    if (
      String(run.id) !== input.run ||
      String(run.run_attempt) !== input.attempt ||
      run.head_sha !== input.sha
    )
      throw new Error("code.public-verification-run");
    const read = (path: string) =>
      codeMetadataRequest(
        `https://api.vercel.com${path}?teamId=${evidence.vercel.teamId}`,
        options.readToken,
        options.fetcher,
      );
    const identity = async () => {
      const project = z
        .object({
          id: z.string(),
          accountId: z.string(),
          targets: z.object({ production: z.object({ id: z.string() }) }),
        })
        .parse(await read(`/v9/projects/${evidence.vercel.projectId}`));
      if (
        project.id !== evidence.vercel.projectId ||
        project.accountId !== evidence.vercel.teamId ||
        project.targets.production.id !== input.deployment
      )
        throw new Error("code.production-drift");
      const deployment = z
        .object({
          id: z.string(),
          url: z.string(),
          projectId: z.string(),
          target: z.string(),
          readyState: z.literal("READY"),
          meta: z.record(z.string(), z.unknown()),
        })
        .parse(await read(`/v13/deployments/${input.deployment}`));
      if (deployment.id !== input.deployment)
        throw new Error("code.public-verification-binding");
      verifyNativeDeploymentIdentity(deployment, evidence, evidenceDigest);
      verifyHealthDomainAliases(
        await Promise.all(
          ["tullyelly.com", "www.tullyelly.com"].map((host) =>
            read(`/v4/aliases/${host}`),
          ),
        ),
        evidence.vercel.projectId,
        input.deployment,
      );
      return deployment;
    };
    const deployment = await identity();
    const observed = await checkApplicationHealth({
      deployment,
      projectId: evidence.vercel.projectId,
      publicDomain: true,
      commit: input.sha,
      publication: evidence.publication,
      analytics: {
        collectionEnabled: evidence.collectionEnabled,
        targetSha256: evidence.analyticsReadiness?.targetSha256,
      },
      fetcher: options.fetcher,
    });
    const analytics = verifyAnalyticsRuntime(observed, {
      commit: input.sha,
      collectionEnabled: evidence.collectionEnabled,
      targetSha256: evidence.analyticsReadiness?.targetSha256,
    });
    await identity();
    return {
      ...binding,
      evidenceSha256: evidenceDigest,
      analytics: {
        intendedEnabled: evidence.collectionEnabled,
        publicObserved: analytics.collectionEnabled,
      },
      state: "public verification passed" as const,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...binding,
      state: "public verification pending" as const,
      completedAt: new Date().toISOString(),
      diagnostic: classifyCodeFailure("health.public", error),
    };
  }
}
