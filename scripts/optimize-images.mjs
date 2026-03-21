import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import {
  collectFiles,
  emptyDir,
  ensureDir,
  formatDirLabel,
  parseFolderArg,
  resolveImageDirs,
} from "./image-optimizer-utils.mjs";

const args = process.argv.slice(2);
const hasHelpFlag = args.includes("-h") || args.includes("--help");

const usage = () => {
  console.log('Usage: npm run images:optimize -- [folder]');
  console.log(
    "Optimizes images under public/images/source into public/images/optimized[/folder].",
  );
};

if (hasHelpFlag) {
  usage();
  process.exit(0);
}

let baseInDirAbs;
let inDirAbs;
let outDirAbs;
try {
  const folderArg = parseFolderArg(args);
  ({ baseInDirAbs, inDirAbs, outDirAbs } = resolveImageDirs(folderArg));
} catch (err) {
  console.error(err.message || "Error: unable to resolve folder path.");
  process.exit(1);
}

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);

async function optimizeOne(srcAbs) {
  const rel = path.relative(inDirAbs, srcAbs);
  const parsed = path.parse(rel);
  const baseName = parsed.name;
  const outSubdir = path.join(outDirAbs, parsed.dir);
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

  console.log(`✓ ${path.relative(baseInDirAbs, srcAbs)}`);
}

(async () => {
  let sources = [];
  let sidecars = [];
  let nonTarget = [];

  try {
    await ensureDir(inDirAbs);
    await ensureDir(outDirAbs);

    ({ sources, sidecars, nonTarget } = await collectFiles(inDirAbs, exts));

    if (sources.length === 0) {
      console.log(`No still image files found in ${formatDirLabel(inDirAbs)}`);
      return;
    }

    for (const file of sources) {
      await optimizeOne(file);
    }
  } catch (err) {
    console.error(err?.message || "Error: image optimization failed.");
    process.exit(1);
  }

  try {
    if (nonTarget.length === 0) {
      await emptyDir(inDirAbs);
      console.log(`Cleaned ${formatDirLabel(inDirAbs)}`);
    } else {
      await Promise.all(
        [...sources, ...sidecars].map((file) => fs.rm(file, { force: true })),
      );
      console.log(
        `Removed ${sources.length} source file(s) from ${formatDirLabel(
          inDirAbs,
        )}; ${nonTarget.length} other file(s) left in place.`,
      );
    }
  } catch (err) {
    console.error(err?.message || "Error: unable to clean source images.");
    process.exit(1);
  }
})();
