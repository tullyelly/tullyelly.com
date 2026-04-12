export const BRICKS_SUBSETS = ["lego"] as const;

export type BricksSubset = (typeof BRICKS_SUBSETS)[number];

export function isBricksSubset(value: string): value is BricksSubset {
  return BRICKS_SUBSETS.includes(value as BricksSubset);
}

export function normalizeBricksPublicId(value: string | number): string {
  const normalized = String(value).trim();

  if (!normalized) {
    throw new Error("Bricks lookup: id must be a non-empty string.");
  }

  return normalized;
}

export function normalizeLegoId(value: string | number): string {
  return normalizeBricksPublicId(value);
}
