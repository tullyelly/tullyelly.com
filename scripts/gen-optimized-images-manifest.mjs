import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const optimizedRoot = path.resolve("public/images/optimized");
const outputPath = path.resolve("lib/images/optimized-images-manifest.json");
const allowedExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);
const outputRootUrl = "/images/optimized";

const toPosixPath = (value) => value.replace(/\\/g, "/");

const toImageUrl = (absolutePath) => {
  const relativePath = toPosixPath(path.relative(optimizedRoot, absolutePath));
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
    await fs.access(optimizedRoot);
  } catch {
    return [];
  }

  const urls = [];
  for await (const filePath of walk(optimizedRoot)) {
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
  const manifest = {
    urls,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
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
