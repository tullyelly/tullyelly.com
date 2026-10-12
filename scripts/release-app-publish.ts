/** Publish only the prepared review branch as an App installation; never deploy or approve. */
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { z } from "zod";
import {
  appConfiguration,
  githubApi,
  RELEASE_REPOSITORY,
  RELEASE_REVIEW_BRANCH,
  withScopedInstallationToken,
  TokenCleanupError,
  type TokenCleanupResult,
} from "./release/app";
import {
  assertReviewPublication,
  verifyInstallationPushUrl,
  installationGitEnvironment,
  readSecureAppKey,
} from "./release/publish";

import {
  publishExactCommit,
  publicationExitCode,
  safeFailure,
  PUBLICATION_TIMEOUT_MS,
  PublicationProcessError,
  type PublicationReport,
} from "./release/publication";

async function main() {
  config({ path: ".env.release-dispatch.local", quiet: true });
  const [mode, flag, commit] = process.argv.slice(2);
  if (
    !["check", "publish"].includes(mode) ||
    flag !== "--commit" ||
    process.argv.slice(2).length !== 3
  )
    throw new Error(
      "Usage: tsx scripts/release-app-publish.ts <check|publish> --commit <SHA>",
    );
  const git = (args: string[]) =>
    execFileSync("git", args, { encoding: "utf8" }).trim();
  assertReviewPublication(
    git(["branch", "--show-current"]),
    git(["rev-parse", "HEAD"]),
    commit,
  );
  if (
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_REPOSITORY !== RELEASE_REPOSITORY
  )
    throw new Error(
      "Local repository configuration differs from the permitted repository.",
    );
  const configuration = appConfiguration({
    ...process.env,
    GITHUB_REPOSITORY: RELEASE_REPOSITORY,
  });
  if (mode === "check") {
    console.log(
      `Prepared review commit ${commit}; App ${configuration.slug}; installation ${configuration.installationId}. No key read or network request.`,
    );
    return;
  }
  const privateKey = readSecureAppKey(
    z.string().min(1).parse(process.env.RELEASE_APP_PRIVATE_KEY_PATH),
  );
  const started = Date.now();
  let report: PublicationReport | undefined;
  const lifecycle: {
    cleanup: TokenCleanupResult["outcome"] | "not-attempted";
  } = { cleanup: "not-attempted" };
  const diagnostic = (event: object) =>
    console.log(JSON.stringify({ event: "app-publication", ...event }));
  try {
    await withScopedInstallationToken(
      configuration,
      privateKey,
      { contents: "write", workflows: "write" },
      async (token) => {
        diagnostic({
          stage: "authentication",
          outcome: "passed",
          elapsedMs: Date.now() - started,
        });
        const pushUrl = `https://github.com/${RELEASE_REPOSITORY}.git`;
        const pushEnv: NodeJS.ProcessEnv = {
          ...installationGitEnvironment(token, process.env),
          NODE_ENV: process.env.NODE_ENV,
        };
        report = await publishExactCommit(commit, {
          diagnostic,
          preflight: async () => {
            const branch = z
              .object({
                commit: z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }),
              })
              .parse(
                await githubApi(
                  `/repos/${RELEASE_REPOSITORY}/branches/main`,
                  token,
                ),
              );
            git(["merge-base", "--is-ancestor", branch.commit.sha, commit]);
            verifyInstallationPushUrl(pushUrl, pushEnv);
          },
          push: async () => {
            try {
              execFileSync(
                "git",
                [
                  "push",
                  pushUrl,
                  `${commit}:refs/heads/${RELEASE_REVIEW_BRANCH}`,
                ],
                {
                  env: pushEnv,
                  encoding: "utf8",
                  stdio: "pipe",
                  timeout: PUBLICATION_TIMEOUT_MS,
                  maxBuffer: 8 * 1024 * 1024,
                },
              );
            } catch (error) {
              throw new PublicationProcessError(error);
            }
          },
          readRemote: async () =>
            z
              .object({
                object: z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }),
              })
              .parse(
                await githubApi(
                  `/repos/${RELEASE_REPOSITORY}/git/ref/heads/${RELEASE_REVIEW_BRANCH}`,
                  token,
                ),
              ).object.sha,
        });
      },
      githubApi,
      (result) => {
        lifecycle.cleanup = result.outcome;
        diagnostic({ stage: "token-revocation", ...result });
      },
    );
  } catch (error) {
    if (!(error instanceof TokenCleanupError))
      diagnostic({
        stage: "authentication",
        outcome: "failed",
        elapsedMs: Date.now() - started,
        failure: safeFailure(error),
      });
  }
  diagnostic({
    stage: "result",
    elapsedMs: Date.now() - started,
    publication: report?.publication ?? "not-published",
    push: report?.push ?? "not-attempted",
    verification: report?.verification ?? "not-attempted",
    cleanup: lifecycle.cleanup,
    remoteSha: report?.remoteSha,
    nextAction:
      report?.publication === "confirmed" && lifecycle.cleanup === "revoked"
        ? "review-only; no retry needed"
        : "stop; inspect remote state and cleanup; never blindly retry",
  });
  process.exitCode = publicationExitCode(report, lifecycle.cleanup);
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "app-publication",
      stage: "local-configuration",
      outcome: "failed",
      failure: safeFailure(error),
    }),
  );
  console.error(
    "App review publication stopped; inspect configuration, branch ancestry and permissions. Keys, tokens and Git/API responses are omitted. No production operation or approval was attempted.",
  );
  process.exitCode = 1;
});
