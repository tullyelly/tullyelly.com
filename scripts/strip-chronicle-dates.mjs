#!/usr/bin/env node
import fs from "node:fs";
import { globSync } from "glob";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const check = args.has("--check");

const files = globSync("content/chronicles/*.mdx", { nodir: true });
const updatedFiles = [];

const dateLineRe = /^(\s*date:\s*["'])([^"']+)(["']\s*)$/;
const frontmatterRe = /^(---\s*\r?\n)([\s\S]*?)(\r?\n---\s*)/;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const frontmatterMatch = text.match(frontmatterRe);
  if (!frontmatterMatch) continue;

  const [, start, body, end] = frontmatterMatch;
  const newline = body.includes("\r\n") ? "\r\n" : "\n";
  const lines = body.split(/\r?\n/);
  let changed = false;

  const nextLines = lines.map((line) => {
    const match = line.match(dateLineRe);
    if (!match) return line;
    const [, prefix, value, suffix] = match;
    if (value.length <= 10) return line;
    const nextValue = value.slice(0, 10);
    if (nextValue === value) return line;
    changed = true;
    return `${prefix}${nextValue}${suffix}`;
  });

  if (!changed) continue;

  const nextBody = nextLines.join(newline);
  const nextText = text.replace(frontmatterMatch[0], `${start}${nextBody}${end}`);

  if (!dryRun) {
    fs.writeFileSync(file, nextText, "utf8");
  }
  updatedFiles.push(file);
}

if (updatedFiles.length === 0) {
  console.log("No chronicle dates to update.");
  process.exit(0);
}

const action = dryRun ? "Would update:" : "Updated:";
console.log(`${action}\n${updatedFiles.join("\n")}`);

if (check) {
  process.exit(1);
}
