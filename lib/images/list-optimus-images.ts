/**
 * listOptimusImages returns a sorted list of URL paths like
 * `/images/optimus/...` from a generated manifest.
 * Input is a path relative to the optimus root; pass "" for the root folder.
 * Security constraints: absolute paths, any `..` segment, or prefixes like `images/` are rejected;
 * missing folders return an empty array.
 */
import "server-only";

import manifest from "@/lib/images/optimus-images-manifest.json";

const OPTIMUS_IMAGE_ROOT_URL = "/images/optimus";
const manifestUrls = Array.isArray(manifest.urls) ? manifest.urls : [];
const OPTIMUS_IMAGE_URLS = manifestUrls
  .filter((url): url is string => typeof url === "string")
  .filter((url) => url.startsWith(`${OPTIMUS_IMAGE_ROOT_URL}/`))
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

export async function listOptimusImages(
  relativeFolder: string,
): Promise<string[]> {
  const normalized = toPosixPath(relativeFolder.trim());

  if (isUnsafeRelativeFolder(normalized)) {
    return [];
  }

  if (!normalized) {
    return [...OPTIMUS_IMAGE_URLS];
  }

  const prefix = `${OPTIMUS_IMAGE_ROOT_URL}/${normalized.replace(/\/+$/, "")}/`;
  return OPTIMUS_IMAGE_URLS.filter((url) => url.startsWith(prefix));
}
