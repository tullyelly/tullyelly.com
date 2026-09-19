import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pathToFileURL } from "node:url";

const optimusRoot = path.resolve("public/images/optimus");
const outputPath = path.resolve("lib/images/optimus-images-manifest.json");
const cachePath = path.resolve(".cache/optimus-images-manifest.json");
const allowedExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);
const outputRootUrl = "/images/optimus";
const cacheVersion = 1;

const toPosixPath = (value) => value.replace(/\\/g, "/");

const toImageUrl = (absolutePath) => {
  const relativePath = toPosixPath(path.relative(optimusRoot, absolutePath));
  return `${outputRootUrl}/${relativePath}`;
};

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function collectFiles() {
  try {
    await fs.access(optimusRoot);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for await (const filePath of walk(optimusRoot)) {
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      continue;
    }
    const stats = await fs.stat(filePath);
    files.push({
      filePath,
      src: toImageUrl(filePath),
      size: stats.size,
      mtimeMs: stats.mtimeMs,
    });
  }

  files.sort((left, right) =>
    left.src < right.src ? -1 : left.src > right.src ? 1 : 0,
  );
  return files;
}

async function readCache() {
  try {
    const cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
    if (cache.version === cacheVersion && cache.images) return cache.images;
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  return {};
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(temporaryPath, filePath);
}

export async function writeManifest() {
  const files = await collectFiles();
  const previousCache = await readCache();
  const nextCache = {};
  const images = [];
  let reused = 0;
  let inspected = 0;

  for (const file of files) {
    const cached = previousCache[file.src];
    if (
      cached?.size === file.size &&
      cached?.mtimeMs === file.mtimeMs &&
      Number.isInteger(cached.width) &&
      Number.isInteger(cached.height)
    ) {
      images.push({
        src: file.src,
        width: cached.width,
        height: cached.height,
      });
      nextCache[file.src] = cached;
      reused += 1;
      continue;
    }

    let metadata;
    try {
      metadata = await sharp(file.filePath).metadata();
    } catch (error) {
      throw new Error(`Unable to read image dimensions: ${file.src}`, {
        cause: error,
      });
    }
    // Normalize each frame before applying the browser's EXIF orientation.
    const frameWidth = metadata.width;
    const frameHeight = metadata.pageHeight ?? metadata.height;
    const swapsAxes = metadata.orientation >= 5 && metadata.orientation <= 8;
    const width = swapsAxes ? frameHeight : frameWidth;
    const height = swapsAxes ? frameWidth : frameHeight;
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(`Invalid image dimensions: ${file.src}`);
    }
    const image = { src: file.src, width, height };
    images.push(image);
    nextCache[file.src] = {
      size: file.size,
      mtimeMs: file.mtimeMs,
      width,
      height,
    };
    inspected += 1;
  }
  const urls = files.map(({ src }) => src);
  const manifest = { urls, images };
  const removed = Object.keys(previousCache).filter(
    (src) => nextCache[src] === undefined,
  ).length;

  await writeJsonAtomic(outputPath, manifest);
  await writeJsonAtomic(cachePath, {
    version: cacheVersion,
    images: nextCache,
  });
  console.log(
    `Image manifest: ${urls.length} images, ${reused} reused, ${inspected} inspected, ${removed} removed`,
  );
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  await writeManifest();
}
