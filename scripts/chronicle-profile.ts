/** Select from the public production revision; unavailable identity uses full validation. */
import { execFileSync, spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  classifyContent,
  type ContentProfile,
} from "./release/content-profile";
import { validateChangedContent } from "./release/validate-content";

const git = (...args: string[]) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
export async function selectContentProfile(fetcher: typeof fetch = fetch) {
  const target = git("rev-parse", "HEAD");
  let baseline = "unavailable";
  try {
    const response = await fetcher("https://www.tullyelly.com/api/__version", {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (response.status !== 200 || response.redirected)
      throw new Error("Unverified production identity");
    const value = (await response.json()) as { commitSha?: unknown };
    if (
      typeof value.commitSha !== "string" ||
      !/^[a-f0-9]{40}$/.test(value.commitSha)
    )
      throw new Error("Unverified revision");
    baseline = value.commitSha;
  } catch {
    /* Full application checks remain available offline or behind Cloudflare. */
  }
  const profile = classifyContent(baseline, target);
  if (git("status", "--porcelain", "--untracked-files=no")) {
    profile.profile = "application";
    profile.reason = "uncommitted-tracked-changes";
  }
  return profile;
}
const contentTests = [
  "__tests__/alter-ego.test.ts",
  "__tests__/chronicle-person-tags.test.ts",
  "__tests__/ChronicleMdxRenderer.test.tsx",
  "__tests__/ChronicleSectionMdxRenderer.test.tsx",
  "__tests__/resolve-chronicle-image-path.test.ts",
  "__tests__/alias-chronicles.test.ts",
  "__tests__/review-chronicle-feed.test.tsx",
  "__tests__/related-content.test.ts",
];
function run(args: string[]) {
  const child = spawnSync("npm", args, {
    stdio: "inherit",
    env: { ...process.env, SKIP_DB: "true" },
  });
  if (child.error || child.signal || child.status !== 0)
    throw new Error("Chronicle validation command failed");
}
export async function validateProfile(profile: ContentProfile) {
  const fresh = classifyContent(profile.baseline, git("rev-parse", "HEAD"));
  if (
    JSON.stringify(fresh) !== JSON.stringify(profile) ||
    fresh.profile !== "content"
  )
    throw new Error("Content profile changed; select again");
  run(["run", "prepare:content"]);
  // Regeneration must reproduce the tracked manifest; cache data is not evidence.
  git("diff", "--exit-code", "--", "lib/images/optimus-images-manifest.json");
  console.log(JSON.stringify(await validateChangedContent(fresh)));
  run([
    "run",
    "test:prepared",
    "--",
    "--runInBand",
    "--runTestsByPath",
    ...contentTests,
  ]);
}
async function main() {
  const mode = process.argv[2];
  if (
    !["select", "validate", "hook"].includes(mode) ||
    process.argv.length !== 3
  )
    throw new Error("Usage: chronicle-profile.ts <select|validate|hook>");
  if (mode === "validate") {
    await validateProfile(
      JSON.parse(readFileSync(".cache/content-profile.json", "utf8")),
    );
    return;
  }
  const profile = await selectContentProfile();
  mkdirSync(".cache", { recursive: true });
  writeFileSync(
    ".cache/content-profile.json",
    JSON.stringify(profile, null, 2) + "\n",
  );
  console.log(JSON.stringify(profile));
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `profile=${profile.profile}\n`);
  if (mode === "hook") {
    if (profile.profile !== "content") {
      process.exitCode = 2;
      return;
    }
    await validateProfile(profile);
  }
}
if (/chronicle-profile\.(?:ts|cjs)$/.test(process.argv[1] ?? ""))
  main().catch(() => {
    console.error(
      "Chronicle checks failed; inspect publication source and assets.",
    );
    process.exitCode = 1;
  });
