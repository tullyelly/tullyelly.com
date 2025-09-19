#!/usr/bin/env node
import { existsSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { exit } from "node:process";

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch (error) {
    return null;
  }
}

function ensureRef(ref) {
  if (!ref || !ref.startsWith("origin/")) {
    return;
  }
  try {
    execSync(`git fetch origin ${ref.replace("origin/", "")} --depth=1`, {
      stdio: "ignore",
    });
  } catch (error) {
    // Ignore fetch issues; merge-base logic will fall back.
  }
}

function determineBaseCommit() {
  const forcedBase = process.env.FORMAT_CHECK_BASE?.trim();
  if (forcedBase) {
    return forcedBase;
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    const remoteRef = `origin/${githubBaseRef}`;
    ensureRef(remoteRef);
    const mergeBase = tryRun(`git merge-base HEAD ${remoteRef}`);
    if (mergeBase) {
      return mergeBase;
    }
  }

  const defaultRemote = "origin/main";
  ensureRef(defaultRemote);
  const defaultMergeBase = tryRun(`git merge-base HEAD ${defaultRemote}`);
  if (defaultMergeBase) {
    return defaultMergeBase;
  }

  if (process.env.CI === "true") {
    return tryRun("git rev-parse HEAD^");
  }

  return null;
}

const baseCommit = determineBaseCommit();
let diffOutput = "";
if (baseCommit) {
  diffOutput =
    tryRun(`git diff --name-only --diff-filter=ACMRTUXB ${baseCommit}..HEAD`) ??
    "";
} else {
  diffOutput = tryRun("git diff --name-only --diff-filter=ACMRTUXB HEAD") ?? "";
}

const supportedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
  ".css",
]);
const filesToCheck = diffOutput
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((file) => {
    const lower = file.toLowerCase();
    return Array.from(supportedExtensions).some((ext) => lower.endsWith(ext));
  })
  .filter((file) => existsSync(file));

if (filesToCheck.length === 0) {
  console.log("No files require format verification.");
  exit(0);
}

const result = spawnSync("npx", ["prettier", "--check", ...filesToCheck], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  exit(result.status ?? 1);
}

exit(result.status ?? 0);
