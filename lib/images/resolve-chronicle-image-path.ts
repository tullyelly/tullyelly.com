const explicitUrlPattern = /^[a-z][a-z\d+.-]*:/i;

function assertSafeRelativePath(value: string, label: string) {
  const path = value.split(/[?#]/, 1)[0]?.replaceAll("\\", "/") ?? "";

  let decodedPath = path;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  if (decodedPath.split("/").includes("..")) {
    throw new Error(`${label} cannot traverse outside its Chronicle folder`);
  }
}

export function resolveChronicleImagePath(slug: string, src: string): string {
  if (
    !src ||
    src.startsWith("/") ||
    src.startsWith("#") ||
    src.startsWith("?") ||
    explicitUrlPattern.test(src)
  ) {
    return src;
  }

  assertSafeRelativePath(src, "Chronicle image path");
  return `/images/optimus/${slug}/${src.replace(/^\.\//, "")}`;
}

export function resolveChronicleCarouselFolder(
  slug: string,
  folder?: string,
): string {
  if (!folder || folder === "." || folder === `./`) {
    return slug;
  }

  assertSafeRelativePath(folder, "Chronicle carousel folder");
  const normalizedFolder = folder.replace(/^\.\//, "").replace(/\/$/, "");

  if (normalizedFolder === slug || normalizedFolder.startsWith(`${slug}/`)) {
    return normalizedFolder;
  }

  return `${slug}/${normalizedFolder}`;
}
