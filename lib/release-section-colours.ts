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

/**
 * Creates a sequential colour getter for one page/render pass.
 * Consumers should create one getter and share it across all eligible
 * ReleaseSection renders in that tree.
 */
export function createNextRainbowColour(total: number): () => string | undefined {
  const colours = buildRainbowColourList(total);
  let index = 0;

  return () => {
    if (colours.length === 0) return undefined;
    const next = colours[index % colours.length];
    index += 1;
    return next;
  };
}

export function getOriginalReleaseSectionColour(
  sectionOrdinal: number,
  totalSections: number,
  sourceKey?: string,
): string | undefined {
  if (!Number.isInteger(sectionOrdinal) || sectionOrdinal < 1) return undefined;
  if (sourceKey && totalSections > 0 && totalSections < RAINBOW_COLOURS.length) {
    let hash = 2166136261;
    for (let index = 0; index < sourceKey.length; index += 1) {
      hash ^= sourceKey.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const available = [...RAINBOW_COLOURS];
    const selected: string[] = [];
    while (selected.length < totalSections) {
      hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
      const picked = Math.abs(hash) % available.length;
      selected.push(available.splice(picked, 1)[0]);
    }
    return sortByRainbowOrder(selected)[sectionOrdinal - 1];
  }
  return buildRainbowColourList(totalSections)[sectionOrdinal - 1];
}

export function createNextOriginalReleaseSectionColour(
  totalSections: number,
  sourceKey: string,
): () => string | undefined {
  let sectionOrdinal = 0;
  return () => {
    sectionOrdinal += 1;
    return getOriginalReleaseSectionColour(sectionOrdinal, totalSections, sourceKey);
  };
}
