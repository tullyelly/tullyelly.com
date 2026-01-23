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
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const SUMMARY_PREFIX = "Take 2; ";
const DAY_SUMMARY_RE = /Day\s+(\d+),/i;

const formatLocalDate = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const assertDateOnly = (value) => {
  if (!DATE_ONLY_RE.test(value)) {
    console.error(`Error: expected date to match YYYY-MM-DD; received "${value}".`);
    process.exit(1);
  }
};

const getLatestChronicle = async () => {
  const files = await fs.readdir(chroniclesDir);
  let latest = null;

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(chroniclesDir, file), "utf8");
    const frontmatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;
    const dateMatch = frontmatterMatch[1].match(
      /^date:\s*["'](.+)["']\s*$/m,
    );
    const summaryMatch = frontmatterMatch[1].match(
      /^summary:\s*["'](.+)["']\s*$/m,
    );
    if (!dateMatch || !summaryMatch) continue;
    const time = Date.parse(dateMatch[1]);
    if (Number.isNaN(time)) continue;

    if (
      !latest ||
      time > latest.time ||
      (time === latest.time && file.localeCompare(latest.file) > 0)
    ) {
      latest = { time, summary: summaryMatch[1], file };
    }
  }

  return latest;
};

const getNextDay = async () => {
  const latest = await getLatestChronicle();
  if (!latest) return 1;
  const dayMatch = latest.summary.match(DAY_SUMMARY_RE);
  if (!dayMatch) return 1;
  const day = Number(dayMatch[1]);
  if (Number.isNaN(day)) return 1;
  return day + 1;
};

const date = formatLocalDate();
assertDateOnly(date);
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
date: "${date}"
summary: "${SUMMARY_PREFIX}Day ${nextDay}, "
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
