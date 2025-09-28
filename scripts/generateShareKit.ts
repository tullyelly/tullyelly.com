import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { canonicalUrl } from "../lib/share/canonicalUrl.ts";
import { oneLiners } from "../lib/share/oneLiners.ts";

function slugFromUrl(url: string): string {
  const { pathname } = new URL(url);
  return pathname.replace(/^\/+/, "").replace(/\/+$/g, "");
}

function toTitle(slug: string): string {
  if (!slug) {
    return "Home";
  }

  return slug
    .split(/[-/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function generateShareDocs(): void {
  const outputDir = resolve(process.cwd(), "docs/share");
  mkdirSync(outputDir, { recursive: true });

  const entries = Object.entries(oneLiners).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  entries.forEach(([slug, oneLiner]) => {
    const canonical = canonicalUrl(slug);
    const normalizedSlug = slugFromUrl(canonical);
    const title = toTitle(normalizedSlug || slug);
    const content = `### ${title}\nURL: ${canonical}\nOne-liner: ${oneLiner}\n`;
    const fileName = `${normalizedSlug || "index"}.md`;
    const filePath = join(outputDir, fileName);

    writeFileSync(filePath, content, "utf8");
  });

  console.log(
    `Generated ${entries.length} share kit snippet${
      entries.length === 1 ? "" : "s"
    } in ${outputDir}`,
  );
}

generateShareDocs();
