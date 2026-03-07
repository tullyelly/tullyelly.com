/**
 * Canonical rainbow palette used by ReleaseSection multi-section assignment.
 * Order is fixed and must stay spectrum-ordered for deterministic sorting.
 */
export const RAINBOW_COLOURS = [
  "#FF0000", // red
  "#FF7F00", // orange
  "#FFFF00", // yellow
  "#00FF00", // green
  "#0000FF", // blue
  "#4B0082", // indigo
  "#8F00FF", // violet
] as const;

const RAINBOW_ORDER = new Map<string, number>(
  RAINBOW_COLOURS.map((colour, index) => [colour, index]),
);

const toSafeTotal = (total: number): number => {
  if (!Number.isFinite(total)) return 0;
  return Math.floor(total);
};

const sortByRainbowOrder = (colours: string[]): string[] =>
  [...colours].sort((a, b) => {
    const aIndex = RAINBOW_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = RAINBOW_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });

const pickRandomUniqueColours = (count: number): string[] => {
  const available = [...RAINBOW_COLOURS];
  const selected: string[] = [];

  while (selected.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    const [picked] = available.splice(randomIndex, 1);
    if (picked) selected.push(picked);
  }

  return selected;
};

/**
 * Builds the per-page rainbow list for non-release-linked ReleaseSection blocks.
 * - total <= 0: empty list.
 * - total >= 7: full spectrum order, repeated as needed.
 * - total <= 6: random unique subset, then re-sorted to spectrum order.
 */
export function buildRainbowColourList(total: number): string[] {
  const safeTotal = toSafeTotal(total);
  if (safeTotal <= 0) return [];

  if (safeTotal >= RAINBOW_COLOURS.length) {
    return Array.from(
      { length: safeTotal },
      (_, index) => RAINBOW_COLOURS[index % RAINBOW_COLOURS.length],
    );
  }

  const selected = pickRandomUniqueColours(safeTotal);
  return sortByRainbowOrder(selected);
}
