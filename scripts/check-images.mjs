import fs from "node:fs/promises";
import path from "node:path";

const inDir = "public/images/source";
const outDir = "public/images/optimized";

const srcExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);
const requiredOutputs = [".jpg", ".webp", ".avif", ".png"]; // what optimize-images.mjs produces

async function* walk(dir) {
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const res = path.resolve(dir, d.name);
    if (d.isDirectory()) yield* walk(res);
    else yield res;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function mtime(p) {
  const s = await fs.stat(p);
  return s.mtimeMs;
}

let failures = [];

const inDirAbs = path.resolve(inDir);
const outDirAbs = path.resolve(outDir);

try {
  await fs.access(inDirAbs);
} catch {
  console.log(`No ${inDir} directory found; nothing to check.`);
  process.exit(0);
}

for await (const src of walk(inDirAbs)) {
  const ext = path.extname(src).toLowerCase();
  if (!srcExts.has(ext)) continue;

  const rel = path.relative(inDirAbs, src);
  const { dir, name } = path.parse(rel);

  const outputs = requiredOutputs.map((oExt) =>
    path.join(outDirAbs, dir, `${name}${oExt}`),
  );

  // ensure all outputs exist
  for (const out of outputs) {
    const exists = await fileExists(out);
    if (!exists) {
      failures.push(
        `Missing output for ${rel} → ${path.relative(process.cwd(), out)}`,
      );
      continue;
    }
    // ensure outputs are not stale
    const [srcTime, outTime] = await Promise.all([mtime(src), mtime(out)]);
    if (outTime < srcTime) {
      failures.push(
        `Stale output for ${rel} → ${path.relative(process.cwd(), out)} (re-run optimizer)`,
      );
    }
  }
}

if (failures.length) {
  console.error("\nImage optimization check failed:\n");
  for (const f of failures) console.error(` - ${f}`);
  console.error(
    `\nFix: run "npm run images:optimize" locally and commit the updated files in ${outDir}/.\n`,
  );
  process.exit(1);
} else {
  console.log("All images are optimized and up to date ✅");
}
