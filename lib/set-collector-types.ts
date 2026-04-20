export function normalizeSetCollectorSlug(value: string | number): string {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  if (!normalized) {
    throw new Error("Set Collector lookup: slug must be a non-empty string.");
  }

  return normalized;
}

export function formatSetCollectorRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

export function formatSetCollectorPercentComplete(value: number): string {
  return `${value}%`;
}
