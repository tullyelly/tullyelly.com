import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inDir = "public/images/source"; // drop your originals here
const outDir = "public/images/optimized"; // optimized outputs land here

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);

async function* walk(dir) {
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const res = path.resolve(dir, d.name);
    if (d.isDirectory()) yield* walk(res);
    else yield res;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function optimizeOne(srcAbs) {
  const rel = path.relative(inDir, srcAbs);
  const parsed = path.parse(rel);
  const baseName = parsed.name;
  const outSubdir = path.join(outDir, parsed.dir);
  await ensureDir(outSubdir);

  const img = sharp(srcAbs);
  const meta = await img.metadata();
  const maxW = Math.min(1920, meta.width || 1920);

  const pipe = sharp(srcAbs).resize({ width: maxW, withoutEnlargement: true });

  // Export a single optimized WebP
  await pipe
    .clone()
    .webp({ quality: 80 })
    .toFile(path.join(outSubdir, `${baseName}.webp`));

  console.log(`✓ ${rel}`);
}

(async () => {
  await ensureDir(inDir);
  await ensureDir(outDir);

  for await (const file of walk(inDir)) {
    if (!exts.has(path.extname(file).toLowerCase())) continue;
    await optimizeOne(file);
  }
})();
