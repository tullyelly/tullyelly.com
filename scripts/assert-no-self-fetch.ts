/* Simple scan: fails if server files use fetch('/api') or getBaseUrl() to build API URLs */
import fs from "fs";
import path from "path";

const ROOTS = ["app", "lib"];
const SERVER_GLOBS = [
  "page.tsx",
  "page.ts",
  "layout.tsx",
  "layout.ts",
  ".ts",
  ".tsx",
];

function walk(dir: string, acc: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (SERVER_GLOBS.some((g) => p.endsWith(g))) acc.push(p);
  }
  return acc;
}

const files = ROOTS.flatMap((r) => (fs.existsSync(r) ? walk(r) : []));
const offenders: string[] = [];

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (/(^|\n)\s*['"]use client['"];?/.test(s)) {
    continue;
  }
  if (/fetch\(['"`]\/api\//.test(s)) offenders.push(f + ' -> fetch("/api/…")');
  if (/getBaseUrl\(\).*\/api\//.test(s))
    offenders.push(f + " -> getBaseUrl() + /api");
}

if (offenders.length) {
  console.error(
    "❌ Found intra-app fetches in server files:\n" + offenders.join("\n"),
  );
  process.exit(1);
} else {
  console.log("✅ No intra-app HTTP found in server files.");
}
