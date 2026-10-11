/** Prepare the initial App-owned draft before the dispatcher exists on main. */
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { z } from "zod";
import { dispatchInputSchema, prepareDraftPr } from "./release-dispatch";
import {
  appConfiguration,
  githubApi,
  RELEASE_REPOSITORY,
  withInstallationToken,
} from "./release/app";
import { assertReviewPublication, readSecureAppKey } from "./release/publish";

export function bootstrapDraftInput(args: string[]) {
  const [mode, commitFlag, sha, titleFlag, title] = args;
  if (
    !["check", "create"].includes(mode) ||
    commitFlag !== "--commit" ||
    titleFlag !== "--title" ||
    args.length !== 5
  )
    throw new Error(
      "Usage: tsx scripts/release-app-draft.ts <check|create> --commit <SHA> --title <approved title>",
    );
  return {
    mode,
    input: dispatchInputSchema.parse({ mode: "draft-pr", sha, title }),
  };
}
async function main() {
  config({ path: ".env.release-dispatch.local", quiet: true });
  const { mode, input } = bootstrapDraftInput(process.argv.slice(2));
  if (input.mode !== "draft-pr")
    throw new Error("Bootstrap supports only an App-owned draft PR");
  const git = (args: string[]) =>
    execFileSync("git", args, { encoding: "utf8" }).trim();
  assertReviewPublication(
    git(["branch", "--show-current"]),
    git(["rev-parse", "HEAD"]),
    input.sha,
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
      git(["merge-base", "--is-ancestor", main.commit.sha, input.sha]);
      return prepareDraftPr(input, configuration, token);
    },
  );
  console.log(
    `App-owned draft verified: ${url}. No merge, workflow dispatch, approval or deployment performed.`,
  );
}
if (process.argv[1]?.endsWith("release-app-draft.ts"))
  main().catch(() => {
    console.error(
      "Bootstrap draft stopped. Check exact branch SHA, current main ancestry, repository-only installation and App identity. Credentials and API bodies are omitted; do not retry an ambiguous PR creation without inspecting existing drafts.",
    );
    process.exitCode = 1;
  });
