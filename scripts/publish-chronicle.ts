/** Experienced-operator entry point; production credentials stay in Actions. */
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  openSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { z } from "zod";
import {
  appConfiguration,
  githubApi,
  RELEASE_REPOSITORY,
  withScopedInstallationToken,
} from "./release/app";
import { readSecureAppKey } from "./release/publish";
import {
  publicationProgress,
  type PublicationProgress,
} from "./release/publication-progress";
import { downloadPublicationReceipt } from "./release/publication-receipt";
import { selectContentProfile } from "./chronicle-profile";
import { classifyContent } from "./release/content-profile";

export function publicationArguments(args: string[]) {
  if (
    args.length !== 2 ||
    !["publish", "status"].includes(args[0]) ||
    !/^[a-f0-9]{40}$/.test(args[1])
  )
    throw new Error(
      "Usage: npm run chronicle:publish -- <merged-SHA> or npm run chronicle:status -- <SHA>",
    );
  return { mode: args[0] as "publish" | "status", sha: args[1] };
}
async function main() {
  const { mode, sha } = publicationArguments(process.argv.slice(2));
  config({ path: ".env.release-dispatch.local", quiet: true });
  const configuration = appConfiguration({
    ...process.env,
    GITHUB_REPOSITORY: RELEASE_REPOSITORY,
  });
  const key = readSecureAppKey(
    z.string().min(1).parse(process.env.RELEASE_APP_PRIVATE_KEY_PATH),
  );
  const gitPath = (name: string) =>
    execFileSync("git", ["rev-parse", "--git-path", name], {
      encoding: "utf8",
    }).trim();
  const intent = gitPath(`chronicle-publication-${sha}.json`);
  const lock = gitPath("chronicle-publication.lock");
  let descriptor: number | undefined;
  try {
    if (mode === "publish") descriptor = openSync(lock, "wx");
    const selection = await selectContentProfile();
    const profile = classifyContent(selection.baseline, sha);
    console.log(
      JSON.stringify({
        profile: profile.profile,
        reason: profile.reason,
        sha,
        posts: profile.chronicles,
        note: "Existing PR review and production-release approval apply.",
      }),
    );
    const started = Date.now();
    let previous: PublicationProgress["state"] | undefined;
    for (;;) {
      // Each polling read uses a fresh narrow token, revoked before any wait.
      const progress = await withScopedInstallationToken(
        configuration,
        key,
        mode === "publish"
          ? { actions: "write", contents: "read" }
          : { actions: "read", contents: "read" },
        (token) =>
          publicationProgress({
            mode,
            sha,
            token,
            api: githubApi,
            hasIntent: () => existsSync(intent),
            recordIntent: () =>
              writeFileSync(
                intent,
                JSON.stringify({ sha, requestedAt: new Date().toISOString() }) +
                  "\n",
                { flag: "wx" },
              ),
            receipt: (run) => downloadPublicationReceipt(run, token, githubApi),
          }),
      );
      if (progress.state !== previous)
        console.log(
          JSON.stringify({
            ...progress,
            publications: profile.chronicles.map(
              (slug) => `https://tullyelly.com/shaolin/${slug}`,
            ),
          }),
        );
      previous = progress.state;
      if (
        mode === "status" ||
        !["checking", "dispatched", "running", "approval"].includes(
          progress.state,
        ) ||
        Date.now() - started > 45 * 60 * 1000
      ) {
        if (
          ["failed", "dispatch-unconfirmed", "receipt-unavailable"].includes(
            progress.state,
          )
        )
          process.exitCode = 1;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
      unlinkSync(lock);
    }
  }
}
if (/publish-chronicle\.(?:ts|cjs)$/.test(process.argv[1] ?? ""))
  main().catch(() => {
    console.error(
      "Publication stopped. Read chronicle:status and the existing Actions run before any retry; credentials omitted.",
    );
    process.exitCode = 1;
  });
