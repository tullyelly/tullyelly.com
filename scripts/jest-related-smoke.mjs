#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE =
  process.env.TEST_SMOKE_BASE_REF ||
  process.env.COVERAGE_BASE_REF ||
  'origin/main';

function tryGit(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function baseRef() {
  const hasBase = tryGit(`git rev-parse --verify ${BASE}`);
  if (hasBase) return BASE;
  const ancestor = tryGit('git rev-parse --verify HEAD~1');
  return ancestor || 'HEAD';
}

function changedFiles(base) {
  const out = tryGit(`git diff --name-only --diff-filter=AMR ${base}...HEAD`);
  if (!out) return [];
  return out.split('\n').filter(Boolean);
}

function filterSource(files) {
  const re = /\.(ts|tsx|js|jsx|mjs|cjs)$/i;
  return files.filter((file) => re.test(file));
}

function detectJest() {
  const pkgPath = resolve('package.json');
  if (!existsSync(pkgPath)) return false;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const jestInDeps = Boolean(pkg.devDependencies?.jest || pkg.dependencies?.jest);
  const hasConfig = configCandidates().some((file) => existsSync(resolve(file)));
  return jestInDeps || hasConfig;
}

function configCandidates() {
  return [
    'jest.config.cjs',
    'jest.config.ts',
    'jest.config.js',
    'jest.config.mjs',
  ];
}

function resolveConfig() {
  const file = configCandidates().find((candidate) =>
    existsSync(resolve(candidate)),
  );
  return file ? resolve(file) : undefined;
}

if (!detectJest()) {
  console.error('❌ Jest not detected in this project.');
  process.exit(1);
}

const base = baseRef();
const files = filterSource(changedFiles(base));
const config = resolveConfig();
const extraArgs = process.argv.slice(2);

if (files.length === 0) {
  console.log('ℹ️  No related source changes detected; skipping smoke run.');
  process.exit(0);
}

const args = [
  'jest',
  ...(config ? ['--config', config] : []),
  '--runInBand',
  '--findRelatedTests',
  '--passWithNoTests',
  ...files,
  ...extraArgs,
];

const result = spawnSync('npx', args, { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
