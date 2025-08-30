#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const nowIso = new Date().toISOString();

const commitSha =
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  sh("git rev-parse HEAD") ||
  "";

const commitShaShort = commitSha ? commitSha.slice(0, 12) : "";

const commitRef =
  process.env.GITHUB_REF_NAME ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  sh("git rev-parse --abbrev-ref HEAD") ||
  "";

const buildId =
  process.env.VERCEL_BUILD_ID ||
  process.env.BUILD_ID ||
  `${nowIso.replace(/[:.]/g, "-")}-${commitShaShort || "local"}`;

const source =
  process.env.GITHUB_ACTIONS ? "github-actions" :
  process.env.VERCEL ? "vercel" :
  "local";

const payload = {
  ok: true,
  app: "tullyelly.com",
  env: process.env.NODE_ENV || "development",
  source,
  buildId,
  buildTime: nowIso,
  commitSha,
  commitShaShort,
  commitRef,
};

const outDir = resolve(".next/generated");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "build-info.json");
writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");

console.log(`Wrote build info → ${outFile}`);
