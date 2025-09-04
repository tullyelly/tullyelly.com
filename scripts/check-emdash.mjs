#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dirs = ['app', 'components', 'pages', 'content'];
const rg = spawnSync('rg', ['--files-with-matches', '—', ...dirs], { encoding: 'utf8' });
if (rg.status === 0 && rg.stdout) {
  const files = rg.stdout.trim().split('\n').filter(Boolean);
  const offenders = files.filter((file) => {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('punctuation-allowed')) return false;
    if (/^---[\s\S]*?punctuation:\s*allowed[\s\S]*?---/m.test(text)) return false;
    return true;
  });
  if (offenders.length) {
    console.error('Em dash found in:\n' + offenders.join('\n'));
    process.exit(1);
  }
}
