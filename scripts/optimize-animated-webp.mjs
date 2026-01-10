import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const baseInDir = "public/images/source"; // drop your originals here
const baseOutDir = "public/images/optimized"; // optimized outputs land here

const args = process.argv.slice(2);
const hasHelpFlag = args.includes("-h") || args.includes("--help");

const usage = () => {
  console.log('Usage: npm run images:animated -- "folder"');
  console.log(
    "Converts .gif and .mp4 under public/images/source into animated WebP outputs in public/images/optimized/<folder>.",
  );
};

if (hasHelpFlag) {
  usage();
  process.exit(0);
}

const folderParts = [];
const positionalParts = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "-f" || arg === "--folder") {
    if (folderParts.length) {
      console.error("Error: --folder provided more than once.");
      process.exit(1);
    }
    if (i + 1 >= args.length) {
      console.error("Error: --folder requires a value.");
      process.exit(1);
    }
    i += 1;
    if (args[i].startsWith("-")) {
      console.error("Error: --folder requires a value.");
      process.exit(1);
    }
    while (i < args.length && !args[i].startsWith("-")) {
      folderParts.push(args[i]);
      i += 1;
    }
    i -= 1;
    continue;
  }
  if (!arg.startsWith("-")) {
    positionalParts.push(arg);
  }
}

if (folderParts.length && positionalParts.length) {
  console.error("Error: use either --folder or a positional folder, not both.");
  process.exit(1);
}

const folderArgRaw = folderParts.length
  ? folderParts.join(" ")
  : positionalParts.join(" ");
const folderArg = folderArgRaw ? folderArgRaw.trim() : undefined;

if (!folderArg) {
  usage();
  process.exit(1);
}

const baseInDirAbs = path.resolve(baseInDir);
const baseOutDirAbs = path.resolve(baseOutDir);

const normalizeFolderArg = (value) => {
  if (!value) return undefined;
  const resolved = path.resolve(value);
  const relFromIn = path.relative(baseInDirAbs, resolved);
  if (!relFromIn.startsWith("..") && !path.isAbsolute(relFromIn)) {
    return relFromIn || undefined;
  }
  const relFromOut = path.relative(baseOutDirAbs, resolved);
  if (!relFromOut.startsWith("..") && !path.isAbsolute(relFromOut)) {
    return relFromOut || undefined;
  }
  return value;
};

const resolveWithin = (baseAbs, subdir) => {
  if (!subdir) return baseAbs;
  const resolved = path.resolve(baseAbs, subdir);
  const rel = path.relative(baseAbs, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Error: folder must live under ${baseAbs}`);
  }
  return resolved;
};

const normalizedFolderArg = normalizeFolderArg(folderArg);

const inDirAbs = baseInDirAbs;
let outDirAbs;
try {
  outDirAbs = resolveWithin(baseOutDirAbs, normalizedFolderArg);
} catch (err) {
  console.error(err.message || "Error: unable to resolve folder path.");
  process.exit(1);
}

const exts = new Set([".gif", ".mp4"]);

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

async function emptyDir(p) {
  await fs.rm(p, { recursive: true, force: true });
  await fs.mkdir(p, { recursive: true });
}

const stripFolderPrefix = (relPath, folderPrefix) => {
  if (!folderPrefix) return relPath;
  const normalizedRel = path.normalize(relPath);
  const normalizedPrefix = path.normalize(folderPrefix);
  const prefixWithSep = `${normalizedPrefix}${path.sep}`;
  if (normalizedRel.startsWith(prefixWithSep)) {
    return normalizedRel.slice(prefixWithSep.length);
  }
  return relPath;
};

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
  const relFromSource = path.relative(inDirAbs, srcAbs);
  const rel = stripFolderPrefix(relFromSource, normalizedFolderArg);
  const parsed = path.parse(rel);
  const outSubdir = path.join(outDirAbs, parsed.dir);
  await ensureDir(outSubdir);
  const outAbs = path.join(outSubdir, `${parsed.name}.webp`);

  await runFfmpeg(srcAbs, outAbs);

  console.log(`OK ${path.relative(baseInDirAbs, srcAbs)}`);
}

(async () => {
  let sources = [];
  let nonTarget = [];

  try {
    await ensureDir(inDirAbs);
    await ensureDir(outDirAbs);

    for await (const file of walk(inDirAbs)) {
      const ext = path.extname(file).toLowerCase();
      if (exts.has(ext)) sources.push(file);
      else nonTarget.push(file);
    }

    if (sources.length === 0) {
      console.log("No .gif or .mp4 files found in public/images/source.");
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
      await emptyDir(baseInDirAbs);
      console.log(`Cleaned ${path.relative(process.cwd(), baseInDirAbs)}/`);
    } else {
      await Promise.all(
        sources.map((file) => fs.rm(file, { force: true })),
      );
      console.log(
        `Removed ${sources.length} source file(s) from ${path.relative(
          process.cwd(),
          baseInDirAbs,
        )}/; ${nonTarget.length} other file(s) left in place.`,
      );
    }
  } catch (err) {
    console.error(err?.message || "Error: unable to clean source animations.");
    process.exit(1);
  }
})();
