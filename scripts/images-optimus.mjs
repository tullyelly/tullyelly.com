import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

import {
  baseInDir,
  collectFiles,
  emptyDir,
  ensureDir,
  formatDirLabel,
  optimusOutDir,
  parseFolderArg,
  resolveImageDirs,
} from "./image-optimizer-utils.mjs";
import { writeManifest } from "./gen-optimus-images-manifest.mjs";

const args = process.argv.slice(2);
const hasHelpFlag = args.includes("-h") || args.includes("--help");

const usage = () => {
  console.log('Usage: npm run images:optimus -- [folder]');
  console.log(
    "Optimizes still images and animated sources under public/images/source into public/images/optimus.",
  );
  console.log(
    "The optional folder is an output folder only; images are always read from public/images/source.",
  );
};

if (hasHelpFlag) {
  usage();
  process.exit(0);
}

const stillExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);
const animatedExts = new Set([".gif", ".mp4"]);
const supportedExts = new Set([...stillExts, ...animatedExts]);
const ffmpegFilter = "fps=12,scale=480:-1:flags=lanczos";

const buildFfmpegArgs = (srcAbs, outAbs) => [
  "-y",
  "-i",
  srcAbs,
  "-vcodec",
  "libwebp",
  "-loop",
  "0",
  "-preset",
  "default",
  "-an",
  "-vsync",
  "0",
  "-q:v",
  "60",
  "-compression_level",
  "6",
  "-lossless",
  "0",
  "-vf",
  ffmpegFilter,
  outAbs,
];

const runFfmpeg = (srcAbs, outAbs, relFromSource) =>
  new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", buildFfmpegArgs(srcAbs, outAbs), {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });

    proc.on("error", (err) => {
      if (err?.code === "ENOENT") {
        reject(new Error("Error: ffmpeg is not installed or not on PATH."));
        return;
      }

      reject(
        new Error(
          `Error: ffmpeg failed to start${err?.message ? `: ${err.message}` : "."}`,
        ),
      );
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim();
      reject(
        new Error(
          detail
            ? `Error: ffmpeg failed for ${relFromSource}.\n${detail}`
            : `Error: ffmpeg failed for ${relFromSource}.`,
        ),
      );
    });
  });

async function optimizeStill(srcAbs, inDirAbs, outDirAbs) {
  const rel = path.relative(inDirAbs, srcAbs);
  const parsed = path.parse(rel);
  const outSubdir = path.join(outDirAbs, parsed.dir);
  await ensureDir(outSubdir);

  const img = sharp(srcAbs);
  const meta = await img.metadata();
  const maxW = Math.min(1920, meta.width || 1920);

  await sharp(srcAbs)
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outSubdir, `${parsed.name}.webp`));

  console.log(`✓ ${rel}`);
}

async function optimizeAnimated(srcAbs, inDirAbs, outDirAbs) {
  const rel = path.relative(inDirAbs, srcAbs);
  const parsed = path.parse(rel);
  const outSubdir = path.join(outDirAbs, parsed.dir);
  await ensureDir(outSubdir);

  const outAbs = path.join(outSubdir, `${parsed.name}.webp`);
  await runFfmpeg(srcAbs, outAbs, rel);

  console.log(`OK ${rel}`);
}

(async () => {
  let baseInDirAbs;
  let inDirAbs;
  let outDirAbs;

  try {
    const folderArg = parseFolderArg(args);
    ({ baseInDirAbs, outDirAbs } = resolveImageDirs(folderArg, {
      outDir: optimusOutDir,
    }));
    inDirAbs = baseInDirAbs;
    await ensureDir(inDirAbs);
    await ensureDir(outDirAbs);
  } catch (err) {
    console.error(err?.message || "Error: unable to resolve image paths.");
    process.exit(1);
  }

  let sources = [];
  let sidecars = [];
  let nonTarget = [];

  try {
    ({ sources, sidecars, nonTarget } = await collectFiles(
      inDirAbs,
      supportedExts,
    ));

    if (sources.length === 0) {
      console.log(
        `No supported image source files found in ${formatDirLabel(inDirAbs)}`,
      );
      await writeManifest();
      return;
    }

    for (const file of sources) {
      const ext = path.extname(file).toLowerCase();
      if (stillExts.has(ext)) {
        await optimizeStill(file, inDirAbs, outDirAbs);
        continue;
      }

      if (animatedExts.has(ext)) {
        await optimizeAnimated(file, inDirAbs, outDirAbs);
      }
    }
  } catch (err) {
    console.error(
      err?.message || `Error: unable to optimize assets in ${baseInDir}.`,
    );
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

  try {
    await writeManifest();
  } catch (err) {
    console.error(err?.message || "Error: unable to write image manifest.");
    process.exit(1);
  }
})();
