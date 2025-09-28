const BASE_URL = "https://tullyelly.com";

function normalizeSlug(slug: string): string {
  const trimmed = slug.trim();
  const withoutSlashes = trimmed.replace(/^\/+/g, "").replace(/\/+$/g, "");
  return withoutSlashes.toLowerCase();
}

export function canonicalUrl(slug: string): string {
  const normalized = normalizeSlug(slug);
  if (!normalized) {
    return BASE_URL;
  }

  return `${BASE_URL}/${normalized}`;
}
