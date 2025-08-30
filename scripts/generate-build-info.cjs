const { writeFileSync } = require('fs');
const { execSync } = require('child_process');

function get(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return '';
  }
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA || get('git rev-parse HEAD');
const shortCommit = commit ? commit.slice(0, 7) : '';
const branch = process.env.VERCEL_GIT_COMMIT_REF || get('git rev-parse --abbrev-ref HEAD');
const buildIso = new Date().toISOString();
const buildYear = new Date().getUTCFullYear();

const contents = `export const buildInfo = {\n` +
  `  buildIso: '${buildIso}',\n` +
  `  buildYear: ${buildYear},\n` +
  `  commit: '${commit}',\n` +
  `  shortCommit: '${shortCommit}',\n` +
  `  branch: '${branch}',\n` +
  `} as const;\n`;

writeFileSync('lib/build-info.ts', contents);
console.log('Generated lib/build-info.ts');
