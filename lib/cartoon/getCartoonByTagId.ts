import "server-only";

import { sql } from "@/lib/db";
import manifest from "@/lib/images/optimus-images-manifest.json";

type IdentityCartoonRow = {
  image_path: string;
  description: string | null;
};

export type IdentityCartoon = {
  imagePath: string;
  description: string | null;
};

const OPTIMUS_CARTOON_PREFIX = "/images/optimus/cartoon/";
const LEGACY_CARTOON_PREFIXES = ["/images/optimized/cartoon/"] as const;
const IMAGE_EXTENSION_PATTERN = /\.(?:gif|jpe?g|png|webp)$/i;

const manifestUrls = Array.isArray(manifest.urls) ? manifest.urls : [];
const optimusImageUrls = manifestUrls.filter(
  (url): url is string =>
    typeof url === "string" && url.startsWith("/images/optimus/"),
);
const optimusImageUrlSet = new Set(optimusImageUrls);
const optimusImageUrlByLowercase = new Map(
  optimusImageUrls.map((url) => [url.toLowerCase(), url] as const),
);

function normalizePublicImagePath(imagePath: string): string {
  const normalized = imagePath.trim().replace(/\\/g, "/");
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;

  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

function getManifestImageUrl(imagePath: string): string | null {
  if (optimusImageUrlSet.has(imagePath)) {
    return imagePath;
  }

  return optimusImageUrlByLowercase.get(imagePath.toLowerCase()) ?? null;
}

function normalizeLegacyCartoonPath(imagePath: string): string {
  const lowercaseImagePath = imagePath.toLowerCase();

  for (const legacyPrefix of LEGACY_CARTOON_PREFIXES) {
    if (lowercaseImagePath.startsWith(legacyPrefix)) {
      return `${OPTIMUS_CARTOON_PREFIX}${imagePath.slice(legacyPrefix.length)}`;
    }
  }

  return imagePath;
}

export function resolveCartoonImagePath(imagePath: string): string | null {
  const normalized = normalizeLegacyCartoonPath(
    normalizePublicImagePath(imagePath),
  );
  const exactMatch = getManifestImageUrl(normalized);

  if (exactMatch) {
    return exactMatch;
  }

  if (
    normalized.toLowerCase().startsWith(OPTIMUS_CARTOON_PREFIX) &&
    !IMAGE_EXTENSION_PATTERN.test(normalized)
  ) {
    return getManifestImageUrl(`${normalized}.webp`);
  }

  if (normalized.toLowerCase().startsWith(OPTIMUS_CARTOON_PREFIX)) {
    return null;
  }

  return normalized;
}

export async function getCartoonByTagId(
  tagId: number,
): Promise<IdentityCartoon | null> {
  const [row] = await sql<IdentityCartoonRow>`
    SELECT image_path, description
    FROM dojo.identity_cartoon
    WHERE tag_id = ${tagId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  const imagePath = resolveCartoonImagePath(row.image_path);
  if (!imagePath) {
    return null;
  }

  return {
    imagePath,
    description: row.description,
  };
}
