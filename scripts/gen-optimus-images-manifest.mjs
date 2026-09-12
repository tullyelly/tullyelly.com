import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pathToFileURL } from "node:url";

const optimusRoot = path.resolve("public/images/optimus");
const outputPath = path.resolve("lib/images/optimus-images-manifest.json");
const allowedExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);
const outputRootUrl = "/images/optimus";

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

async function collectUrls() {
  try {
    await fs.access(optimusRoot);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const urls = [];
  for await (const filePath of walk(optimusRoot)) {
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      continue;
    }
    urls.push(toImageUrl(filePath));
  }

  urls.sort();
  return urls;
}

export async function writeManifest() {
  const urls = await collectUrls();
  const images = [];
  for (const src of urls) {
    const filePath = path.join(
      optimusRoot,
      src.slice(outputRootUrl.length + 1),
    );
    let metadata;
    try {
      metadata = await sharp(filePath).metadata();
    } catch (error) {
      throw new Error(`Unable to read image dimensions: ${src}`, {
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
      throw new Error(`Invalid image dimensions: ${src}`);
    }
    images.push({ src, width, height });
  }
  const manifest = { urls, images };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Wrote ${path.relative(process.cwd(), outputPath)} with ${urls.length} images.`,
  );
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  await writeManifest();
}
