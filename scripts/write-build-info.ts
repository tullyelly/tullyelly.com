import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function git(cmd: string): string | undefined {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return undefined;
  }
}

const fullSha =
  getEnv('VERCEL_GIT_COMMIT_SHA') || git('git rev-parse HEAD') || '';
const shortSha = fullSha.substring(0, 7);
const ref = getEnv('VERCEL_GIT_COMMIT_REF') || git('git rev-parse --abbrev-ref HEAD');
const pr = getEnv('VERCEL_GIT_PULL_REQUEST_ID');
const env = getEnv('VERCEL_ENV') || getEnv('NODE_ENV') || 'development';
const url = getEnv('VERCEL_URL') || 'http://localhost:3000';
const runtime = `node ${process.version}`;
const builtAt = new Date().toISOString();

const info = {
  commitSha: fullSha,
  commitShortSha: shortSha,
  ref,
  prNumber: pr,
  env,
  url,
  runtime,
  builtAt,
};

const file = resolve(process.cwd(), 'build-info.json');
writeFileSync(file, JSON.stringify(info, null, 2));
