/**
 * listOptimizedImages returns a sorted list of URL paths like
 * `/images/optimized/...` from a generated manifest.
 * Input is a path relative to the optimized root; pass "" for the root folder.
 * Security constraints: absolute paths, any `..` segment, or prefixes like `images/` are rejected;
 * missing folders return an empty array.
 */
import "server-only";

import manifest from "@/lib/images/optimized-images-manifest.json";

const OPTIMIZED_IMAGE_ROOT_URL = "/images/optimized";
const manifestUrls = Array.isArray(manifest.urls) ? manifest.urls : [];
const OPTIMIZED_IMAGE_URLS = manifestUrls
  .filter((url): url is string => typeof url === "string")
  .filter((url) => url.startsWith(`${OPTIMIZED_IMAGE_ROOT_URL}/`))
  .sort();

const toPosixPath = (value: string) => value.replace(/\\/g, "/");

const isUnsafeRelativeFolder = (value: string) => {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") || value.startsWith("images/")) {
    return true;
  }

  if (/^[A-Za-z]:\//.test(value)) {
    return true;
  }

  return value.split("/").some((segment) => segment === "..");
};

export async function listOptimizedImages(
  relativeFolder: string,
): Promise<string[]> {
  const normalized = toPosixPath(relativeFolder.trim());

  if (isUnsafeRelativeFolder(normalized)) {
    return [];
  }

  if (!normalized) {
    return [...OPTIMIZED_IMAGE_URLS];
  }

  const prefix = `${OPTIMIZED_IMAGE_ROOT_URL}/${normalized.replace(/\/+$/, "")}/`;
  return OPTIMIZED_IMAGE_URLS.filter((url) => url.startsWith(prefix));
}
