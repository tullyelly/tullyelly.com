import fs from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), "app");

// ---- configuration ----
const ENFORCEMENT = (
  process.env.SEO_METADATA_ENFORCE || "strict"
).toLowerCase(); // "strict" | "warn" | "off"
const IGNORE_PREFIXES = [
  "/api",
  "/play",
  "/menu-test",
  "/_sanity",
  "/_components",
  "/_tests",
  "/(internal)",
  "/(drafts)",
];

// helper: collect all files recursively
function allFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? allFiles(p) : [p];
  });
}

function shouldIgnore(rel) {
  return IGNORE_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

// ---- scan ----
const pages = allFiles(appDir).filter((p) => /[\\/]page\.tsx?$/.test(p));
const offenders = [];

for (const abs of pages) {
  const rel = abs.replace(appDir, "").replace(/\\/g, "/");
  if (shouldIgnore(rel)) continue;
  const src = fs.readFileSync(abs, "utf8");
  const hasMetadata =
    /export\s+const\s+metadata\s*=/.test(src) ||
    /export\s+(?:async\s+)?function\s+generateMetadata\s*\(/.test(src) ||
    /export\s+const\s+generateMetadata\s*=/.test(src);
  if (!hasMetadata) offenders.push(rel);
}

// ---- reporting ----
if (!offenders.length) {
  console.log("✅ All page routes include metadata exports.");
  process.exit(0);
}

const modeMessage =
  ENFORCEMENT === "strict"
    ? "\nCurrently running in STRICT mode (SEO_METADATA_ENFORCE=strict).\nCI fails until metadata is added.\n"
    : ENFORCEMENT === "warn"
      ? "\nCurrently running in WARNING mode (SEO_METADATA_ENFORCE=warn).\nCI passes, but add metadata to eliminate warnings.\n"
      : "\nSEO metadata enforcement is disabled (SEO_METADATA_ENFORCE=off).\n";

const report =
  "\n⚠️  Pages missing metadata:\n" +
  offenders.map((f) => ` - ${f}`).join("\n") +
  modeMessage;

if (ENFORCEMENT === "strict") {
  console.error(report);
  process.exit(1);
} else {
  console.warn(report);
  process.exit(0);
}
