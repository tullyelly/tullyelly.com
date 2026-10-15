/** Create or update an App-owned review PR; never merge or dispatch a release. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { z } from "zod";
import { dispatchInputSchema, prepareDraftPr } from "./release-dispatch";
import {
  appConfiguration,
  githubApi,
  RELEASE_REPOSITORY,
  withInstallationToken,
} from "./release/app";
import {
  assertReviewPublication,
  readSecureAppKey,
  reviewMainAncestry,
} from "./release/publish";

export function bootstrapDraftInput(args: string[]) {
  const [
    mode,
    branchFlag,
    branch,
    commitFlag,
    sha,
    titleFlag,
    title,
    bodyFlag,
    bodyFile,
    ready,
  ] = args;
  if (
    !["check", "create"].includes(mode) ||
    branchFlag !== "--branch" ||
    commitFlag !== "--commit" ||
    titleFlag !== "--title" ||
    bodyFlag !== "--body-file" ||
    !bodyFile ||
    !(args.length === 9 || (args.length === 10 && ready === "--ready"))
  )
    throw new Error(
      "Usage: tsx scripts/release-app-draft.ts <check|create> --branch <working-branch> --commit <SHA> --title <title> --body-file <reviewed-file> [--ready]",
    );
  return {
    mode,
    bodyFile,
    input: dispatchInputSchema.parse({
      mode: "draft-pr",
      branch,
      sha,
      title,
      draft: ready === "--ready" ? false : true,
    }),
  };
}
async function main() {
  config({ path: ".env.release-dispatch.local", quiet: true });
  const {
    mode,
    input: supplied,
    bodyFile,
  } = bootstrapDraftInput(process.argv.slice(2));
  const input = dispatchInputSchema.parse({
    ...supplied,
    body: readFileSync(bodyFile, "utf8"),
  });
  if (input.mode !== "draft-pr")
    throw new Error("Bootstrap supports only an App-owned draft PR");
  const git = (args: string[]) =>
    execFileSync("git", args, { encoding: "utf8" }).trim();
  assertReviewPublication(
    git(["branch", "--show-current"]),
    git(["rev-parse", "HEAD"]),
    input.sha,
    input.branch,
  );
  if (
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_REPOSITORY !== RELEASE_REPOSITORY
  )
    throw new Error("Repository metadata differs from the allowed repository");
  const configuration = appConfiguration({
    ...process.env,
    GITHUB_REPOSITORY: RELEASE_REPOSITORY,
  });
  if (mode === "check") {
    console.log(
      `Prepared App draft for ${input.sha}; no key read, network request or repository write.`,
    );
    return;
  }
  const key = readSecureAppKey(
    z.string().min(1).parse(process.env.RELEASE_APP_PRIVATE_KEY_PATH),
  );
  const url = await withInstallationToken(
    configuration,
    key,
    "draft-pr",
    async (token) => {
      const main = z
        .object({
          commit: z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }),
        })
        .parse(
          await githubApi(`/repos/${RELEASE_REPOSITORY}/branches/main`, token),
        );
      console.log(
        JSON.stringify({
          event: "review-main-ancestry",
          mainSha: main.commit.sha,
          outcome: reviewMainAncestry(main.commit.sha, input.sha),
        }),
      );
      return prepareDraftPr(input, configuration, token);
    },
  );
  console.log(
    `App-owned review PR verified: ${url}. No merge, workflow dispatch, approval or deployment performed.`,
  );
}
if (process.argv[1]?.endsWith("release-app-draft.ts"))
  main().catch(() => {
    console.error(
      "Review PR stopped. Check explicit branch, exact SHA, repository-only installation and App identity. Credentials and API bodies are omitted; do not retry ambiguous creation without inspecting existing PRs.",
    );
    process.exitCode = 1;
  });
