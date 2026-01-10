import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const baseInDir = "public/images/source"; // drop your originals here
const baseOutDir = "public/images/optimized"; // optimized outputs land here

const args = process.argv.slice(2);
const hasHelpFlag = args.includes("-h") || args.includes("--help");

const usage = () => {
  console.log('Usage: npm run images:optimize -- "folder"');
  console.log(
    "Optimizes images under public/images/source into public/images/optimized[/folder].",
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

if (folderArgRaw && !folderArg) {
  console.error("Error: folder name cannot be empty.");
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

async function optimizeOne(srcAbs) {
  const relFromSource = path.relative(inDirAbs, srcAbs);
  const rel = stripFolderPrefix(relFromSource, normalizedFolderArg);
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
  try {
    await ensureDir(inDirAbs);
    await ensureDir(outDirAbs);

    for await (const file of walk(inDirAbs)) {
      if (!exts.has(path.extname(file).toLowerCase())) continue;
      await optimizeOne(file);
    }
  } catch (err) {
    console.error(err?.message || "Error: image optimization failed.");
    process.exit(1);
  }

  try {
    await emptyDir(baseInDirAbs);
    console.log(`Cleaned ${path.relative(process.cwd(), baseInDirAbs)}/`);
  } catch (err) {
    console.error(err?.message || "Error: unable to clean source images.");
    process.exit(1);
  }
})();
