import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

function get(cmd: string): string {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return '';
  }
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || get('git rev-parse HEAD');
const buildTime = new Date().toISOString();
const version = process.env.npm_package_version || '';

const contents = `export const buildInfo = {\n` +
  `  commitSha: '${commit}',\n` +
  `  buildTime: '${buildTime}',\n` +
  `  version: '${version}',\n` +
  `} as const;\n`;

writeFileSync('lib/build-info.ts', contents);
console.log('Generated lib/build-info.ts');
