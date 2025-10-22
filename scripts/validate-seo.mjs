#!/usr/bin/env node
import { promises as fs } from "fs";
import { glob } from "glob";
import matter from "gray-matter";

const files = await glob("app/**/page.mdx");
let hasError = false;
for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  const { data } = matter(src);
  if (!data.canonical) {
    console.error(`${file} missing canonical url`);
    hasError = true;
  }
  if (data.hero) {
    const ratio = data.hero.width / data.hero.height;
    if (Math.abs(ratio - 1.91) > 0.05) {
      console.error(`${file} hero image should be ~1.91:1 ratio`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);
