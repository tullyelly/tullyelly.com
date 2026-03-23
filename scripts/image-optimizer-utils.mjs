import fs from "node:fs/promises";
import path from "node:path";

export const baseInDir = "public/images/source";
export const baseOutDir = "public/images/optimus";
export const optimusOutDir = "public/images/optimus";

export function parseFolderArg(args, { requireFolder = false } = {}) {
  const folderParts = [];
  const positionalParts = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-f" || arg === "--folder") {
      if (folderParts.length) {
        throw new Error("Error: --folder provided more than once.");
      }
      if (i + 1 >= args.length) {
        throw new Error("Error: --folder requires a value.");
      }
      i += 1;
      if (args[i].startsWith("-")) {
        throw new Error("Error: --folder requires a value.");
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
    throw new Error(
      "Error: use either --folder or a positional folder, not both.",
    );
  }

  const folderArgRaw = folderParts.length
    ? folderParts.join(" ")
    : positionalParts.join(" ");
  const folderArg = folderArgRaw ? folderArgRaw.trim() : undefined;

  if (folderArgRaw && !folderArg) {
    throw new Error("Error: folder name cannot be empty.");
  }

  if (requireFolder && !folderArg) {
    throw new Error("Error: folder name is required.");
  }

  return folderArg;
}

function normalizeFolderArg(value, baseInDirAbs, baseOutDirAbs) {
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
}

function resolveWithin(baseAbs, subdir) {
  if (!subdir) return baseAbs;

  const resolved = path.resolve(baseAbs, subdir);
  const rel = path.relative(baseAbs, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Error: folder must live under ${baseAbs}`);
  }

  return resolved;
}

export function resolveImageDirs(folderArg, { outDir = baseOutDir } = {}) {
  const baseInDirAbs = path.resolve(baseInDir);
  const baseOutDirAbs = path.resolve(outDir);
  const normalizedFolderArg = normalizeFolderArg(
    folderArg,
    baseInDirAbs,
    baseOutDirAbs,
  );

  return {
    baseInDirAbs,
    baseOutDirAbs,
    normalizedFolderArg,
    inDirAbs: resolveWithin(baseInDirAbs, normalizedFolderArg),
    outDirAbs: resolveWithin(baseOutDirAbs, normalizedFolderArg),
  };
}

export async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const resolved = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(resolved);
      continue;
    }

    yield resolved;
  }
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function emptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

export async function collectFiles(rootAbs, targetExts) {
  const sources = [];
  const sidecars = [];
  const nonTarget = [];

  for await (const file of walk(rootAbs)) {
    const ext = path.extname(file).toLowerCase();
    if (targetExts.has(ext)) {
      sources.push(file);
      continue;
    }

    if (path.basename(file).endsWith(":Zone.Identifier")) {
      sidecars.push(file);
      continue;
    }

    nonTarget.push(file);
  }

  return { sources, sidecars, nonTarget };
}

export function formatDirLabel(absPath) {
  return `${path.relative(process.cwd(), absPath)}/`;
}
