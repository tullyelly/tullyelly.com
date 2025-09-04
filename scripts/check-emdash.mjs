#!/usr/bin/env node
import fs from 'node:fs';
import { globSync } from 'glob';

const dirs = ['app', 'components', 'pages', 'content'];
const patterns = dirs.map((d) => `${d}/**/*.{js,jsx,ts,tsx,md,mdx}`);
const files = globSync(patterns, { nodir: true });

const offenders = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('—')) continue;
  if (text.includes('punctuation-allowed')) continue;
  if (/^---[\s\S]*?punctuation:\s*allowed[\s\S]*?---/m.test(text)) continue;
  offenders.push(file);
}

if (offenders.length) {
  console.error('Em dash found in:\n' + offenders.join('\n'));
  process.exit(1);
}
