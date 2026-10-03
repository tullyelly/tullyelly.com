#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import matter from "gray-matter";

const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
const files = [
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md",
  ...globSync("docs/**/*.md", {
    ignore: ["docs/archive/**", "docs/share/**", "docs/schema-notes.md"],
  }),
  ...globSync(".agents/skills/*/SKILL.md"),
];
const errors = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const prose = source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const match of source.matchAll(/\bnpm run ([a-z][a-z0-9:-]*)/g)) {
    if (!Object.hasOwn(scripts, match[1])) {
      errors.push(`${file}: unknown npm script ${match[1]}`);
    }
  }
  for (const match of prose.matchAll(
    /\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
  )) {
    const target = match[1];
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue;
    const local = decodeURIComponent(target.split("#")[0]);
    if (!existsSync(path.resolve(path.dirname(file), local))) {
      errors.push(`${file}: missing local link ${target}`);
    }
  }
  if (file.startsWith(".agents/skills/")) {
    const { data } = matter(source);
    if (
      typeof data.name !== "string" ||
      !/^[a-z0-9-]{1,64}$/.test(data.name) ||
      data.name !== path.basename(path.dirname(file)) ||
      typeof data.description !== "string" ||
      !data.description.trim()
    ) {
      errors.push(`${file}: invalid skill name/description metadata`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Documentation context checks passed (${files.length} files).`);
}
