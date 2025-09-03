// Generate build metadata JSON at .build/build-info.json
// Keeps generated artifacts out of Git and loads at runtime.

const { execSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

function getPkgVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const builtAt = new Date().toISOString();
const version = getPkgVersion();

let commit = '';
let branch = '';

try {
  commit = (process.env.VERCEL_GIT_COMMIT_SHA || sh('git rev-parse --short HEAD')).trim();
} catch {}

try {
  branch = (process.env.VERCEL_GIT_COMMIT_REF || sh('git rev-parse --abbrev-ref HEAD')).trim();
} catch {}

const data = {
  commit: commit || 'unknown',
  branch: branch || 'unknown',
  builtAt,
  version: version || '0.0.0',
};

const outDir = resolve(process.cwd(), '.build');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'build-info.json'), JSON.stringify(data, null, 2));
console.log('✓ Wrote .build/build-info.json');

