#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const [, , ...titleParts] = process.argv;
const hasHelpFlag = titleParts.includes("-h") || titleParts.includes("--help");

const usage = () => {
  console.log('Usage: npm run new-chronicle -- "Title"');
  console.log("Creates content/chronicles/<slug>.mdx and public/images/optimized/<slug>/");
};

if (hasHelpFlag) {
  usage();
  process.exit(0);
}

if (titleParts.length === 0) {
  usage();
  process.exit(1);
}

const rawTitle = titleParts.join(" ").trim();

if (!rawTitle) {
  usage();
  process.exit(1);
}

const title = rawTitle.replace(/\s+/g, " ").replace(/"/g, '\\"');

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const slug = slugify(rawTitle);

if (!slug) {
  console.error("Error: unable to generate slug from title.");
  process.exit(1);
}

const chroniclesDir = path.join("content", "chronicles");

const getNextDay = async () => {
  let maxDay = 0;
  const files = await fs.readdir(chroniclesDir);

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(chroniclesDir, file), "utf8");
    const frontmatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;
    const summaryMatch = frontmatterMatch[1].match(
      /^summary:\s*["'](.+)["']\s*$/m,
    );
    if (!summaryMatch) continue;
    const dayMatch = summaryMatch[1].match(/Day\s+(\d+),/i);
    if (!dayMatch) continue;
    const day = Number(dayMatch[1]);
    if (!Number.isNaN(day)) maxDay = Math.max(maxDay, day);
  }

  return maxDay + 1;
};

const pad2 = (value) => String(value).padStart(2, "0");
const now = new Date();
const localDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
  now.getDate(),
)}`;
// Guard against accidental regressions to non date-only strings.
if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
  console.error(
    `Error: expected local date in YYYY-MM-DD format, got "${localDate}".`,
  );
  process.exit(1);
}
const nextDay = await getNextDay();

const chroniclePath = path.join("content", "chronicles", `${slug}.mdx`);
const imagesDir = path.join("public", "images", "optimized", slug);

try {
  await fs.access(chroniclePath);
  console.error(`Error: ${chroniclePath} already exists.`);
  process.exit(1);
} catch (err) {
  if (err && err.code !== "ENOENT") {
    console.error("Error: unable to verify chronicle path.");
    process.exit(1);
  }
}

// Keep frontmatter minimal to satisfy validate-frontmatter.
const content = `---
title: "${title}"
date: "${localDate}"
summary: "Day ${nextDay}, "
tags: []
draft: false
infinityStone: false
---
`;

await fs.mkdir(path.dirname(chroniclePath), { recursive: true });
await fs.writeFile(chroniclePath, content, "utf8");
await fs.mkdir(imagesDir, { recursive: true });

console.log(`Created ${chroniclePath}`);
console.log(`Created ${imagesDir}/`);
