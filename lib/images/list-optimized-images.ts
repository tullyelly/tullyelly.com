/**
 * listOptimizedImages scans `public/images/optimized/<relativeFolder>` recursively and
 * returns a sorted list of URL paths like `/images/optimized/...`.
 * Input is a path relative to the optimized root; pass "" for the root folder.
 * Security constraints: absolute paths, any `..` segment, or prefixes like `images/` are rejected;
 * missing folders return an empty array.
 */
import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const OPTIMIZED_ROOT = path.join(
  process.cwd(),
  "public",
  "images",
  "optimized",
);
const ALLOWED_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);

const toPosixPath = (value: string) => value.replace(/\\/g, "/");

const isUnsafeRelativeFolder = (value: string) => {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") || value.startsWith("images/")) {
    return true;
  }

  if (/^[A-Za-z]:\//.test(value) || path.isAbsolute(value)) {
    return true;
  }

  return value.split("/").some((segment) => segment === "..");
};

const isOutsideRoot = (targetDir: string) => {
  if (targetDir === OPTIMIZED_ROOT) {
    return false;
  }
  return !targetDir.startsWith(`${OPTIMIZED_ROOT}${path.sep}`);
};

const getImageUrl = (filePath: string) => {
  const relativePath = toPosixPath(path.relative(OPTIMIZED_ROOT, filePath));
  return `/images/optimized/${relativePath}`;
};

async function walkOptimizedDir(
  currentDir: string,
  results: string[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkOptimizedDir(fullPath, results);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      results.push(getImageUrl(fullPath));
    }
  }
}

export async function listOptimizedImages(
  relativeFolder: string,
): Promise<string[]> {
  const normalized = toPosixPath(relativeFolder.trim());

  if (isUnsafeRelativeFolder(normalized)) {
    return [];
  }

  const targetDir = path.resolve(OPTIMIZED_ROOT, normalized);
  if (isOutsideRoot(targetDir)) {
    return [];
  }

  let stats: Awaited<ReturnType<typeof stat>>;
  try {
    stats = await stat(targetDir);
  } catch {
    return [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const results: string[] = [];
  await walkOptimizedDir(targetDir, results);
  results.sort();
  return results;
}
