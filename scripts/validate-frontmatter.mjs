#!/usr/bin/env node
import { promises as fs } from "fs";
import { glob } from "glob";
import matter from "gray-matter";
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  description: z.string(),
  canonical: z.string().url().optional(),
  category: z.enum(["music", "video", "campaign"]).optional(),
  hero: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  cta: z.object({ label: z.string(), href: z.string().url() }).optional(),
  tags: z.array(z.string()).optional(),
});

const files = await glob("app/**/page.mdx");
let hasError = false;
for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  const { data } = matter(src);
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Frontmatter errors in ${file}`);
    console.error(result.error.format());
    hasError = true;
  }
}

if (hasError) process.exit(1);
