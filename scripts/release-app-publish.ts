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
} from "./release/app";
import {
  assertReviewPublication,
  assertInstallationPushUrl,
  installationGitEnvironment,
  readSecureAppKey,
} from "./release/publish";

async function main() {
  config({ path: ".env.release-dispatch.local" });
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
  await withScopedInstallationToken(
    configuration,
    privateKey,
    { contents: "write", workflows: "write" },
    async (token) => {
      const branch = z
        .object({
          commit: z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }),
        })
        .parse(
          await githubApi(`/repos/${RELEASE_REPOSITORY}/branches/main`, token),
        );
      git(["merge-base", "--is-ancestor", branch.commit.sha, commit]);
      const pushUrl = `https://github.com/${RELEASE_REPOSITORY}.git`;
      const pushEnv: NodeJS.ProcessEnv = {
        ...installationGitEnvironment(token, process.env),
        NODE_ENV: process.env.NODE_ENV,
      };
      const resolved = execFileSync(
        "git",
        [
          "-c",
          `remote.cipher-app-check.url=${pushUrl}`,
          "remote",
          "get-url",
          "--push",
          "cipher-app-check",
        ],
        { env: pushEnv, encoding: "utf8", stdio: "pipe" },
      ).trim();
      assertInstallationPushUrl(resolved, pushUrl);
      execFileSync(
        "git",
        [
          "push",
          `https://github.com/${RELEASE_REPOSITORY}.git`,
          `${commit}:refs/heads/${RELEASE_REVIEW_BRANCH}`,
        ],
        {
          env: pushEnv,
          encoding: "utf8",
          stdio: "pipe",
          timeout: 60000,
        },
      );
      const published = z
        .object({ object: z.object({ sha: z.string() }) })
        .parse(
          await githubApi(
            `/repos/${RELEASE_REPOSITORY}/git/ref/heads/${RELEASE_REVIEW_BRANCH}`,
            token,
          ),
        );
      if (published.object.sha !== commit)
        throw new Error(
          "Published review branch commit differs; stop for review.",
        );
    },
  );
  console.log(
    `Published review branch ${RELEASE_REVIEW_BRANCH} at ${commit} with repository-scoped App installation authentication.`,
  );
}
main().catch(() => {
  console.error(
    "App review publication stopped; inspect configuration, branch ancestry and permissions. Keys, tokens and Git/API responses are omitted. No production operation or approval was attempted.",
  );
  process.exitCode = 1;
});
