import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

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
  console.log('Usage: npm run images:animated -- [folder]');
  console.log(
    "Converts .gif and .mp4 under public/images/source into animated WebP outputs in public/images/optimus[/folder].",
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

const exts = new Set([".gif", ".mp4"]);

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

const runFfmpeg = (srcAbs, outAbs) =>
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
      const rel = path.relative(baseInDirAbs, srcAbs);
      reject(
        new Error(
          detail
            ? `Error: ffmpeg failed for ${rel}.\n${detail}`
            : `Error: ffmpeg failed for ${rel}.`,
        ),
      );
    });
  });

async function optimizeOne(srcAbs) {
  const rel = path.relative(inDirAbs, srcAbs);
  const parsed = path.parse(rel);
  const outSubdir = path.join(outDirAbs, parsed.dir);
  await ensureDir(outSubdir);
  const outAbs = path.join(outSubdir, `${parsed.name}.webp`);

  await runFfmpeg(srcAbs, outAbs);

  console.log(`OK ${path.relative(baseInDirAbs, srcAbs)}`);
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
      console.log(`No .gif or .mp4 files found in ${formatDirLabel(inDirAbs)}`);
      return;
    }

    for (const file of sources) {
      await optimizeOne(file);
    }
  } catch (err) {
    console.error(err?.message || "Error: animated WebP optimization failed.");
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
    console.error(err?.message || "Error: unable to clean source animations.");
    process.exit(1);
  }
})();
