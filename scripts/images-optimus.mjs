import path from "node:path";
import { spawn } from "node:child_process";

import {
  baseInDir,
  ensureDir,
  parseFolderArg,
  resolveImageDirs,
  walk,
  formatDirLabel,
} from "./image-optimizer-utils.mjs";

const args = process.argv.slice(2);
const hasHelpFlag = args.includes("-h") || args.includes("--help");

const usage = () => {
  console.log('Usage: npm run images:optimus -- [folder]');
  console.log(
    "Optimizes still images and animated sources under public/images/source into public/images/optimized.",
  );
  console.log(
    "Stills use the images:optimize pipeline; .gif and .mp4 files use the images:animated pipeline.",
  );
};

if (hasHelpFlag) {
  usage();
  process.exit(0);
}

const stillExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);
const animatedExts = new Set([".gif", ".mp4"]);

const runScript = (scriptName) =>
  new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [path.resolve("scripts", scriptName), ...args], {
      stdio: "inherit",
    });

    proc.on("error", (err) => {
      reject(
        new Error(
          err?.message
            ? `Error: failed to start ${scriptName}: ${err.message}`
            : `Error: failed to start ${scriptName}.`,
        ),
      );
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Error: ${scriptName} exited with code ${code ?? "unknown"}.`,
        ),
      );
    });
  });

(async () => {
  let inDirAbs;

  try {
    const folderArg = parseFolderArg(args);
    ({ inDirAbs } = resolveImageDirs(folderArg));
    await ensureDir(inDirAbs);
  } catch (err) {
    console.error(err?.message || "Error: unable to resolve image paths.");
    process.exit(1);
  }

  let hasStills = false;
  let hasAnimated = false;

  try {
    for await (const file of walk(inDirAbs)) {
      const ext = path.extname(file).toLowerCase();
      if (stillExts.has(ext)) hasStills = true;
      if (animatedExts.has(ext)) hasAnimated = true;
      if (hasStills && hasAnimated) break;
    }

    if (!hasStills && !hasAnimated) {
      console.log(
        `No supported image source files found in ${formatDirLabel(inDirAbs)}`,
      );
      return;
    }

    if (hasStills) {
      await runScript("optimize-images.mjs");
    }

    if (hasAnimated) {
      await runScript("optimize-animated-webp.mjs");
    }
  } catch (err) {
    console.error(
      err?.message || `Error: unable to optimize assets in ${baseInDir}.`,
    );
    process.exit(1);
  }
})();
