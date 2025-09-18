export const PAGE_SIZE_OPTIONS = [20, 50, 100, 500] as const;

export function coercePageSize(value: string | number | undefined, fallback = PAGE_SIZE_OPTIONS[0]) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric) && PAGE_SIZE_OPTIONS.includes(numeric as (typeof PAGE_SIZE_OPTIONS)[number])) {
    return numeric;
  }
  return fallback;
}

export function coercePage(value: string | number | undefined, fallback = 1) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }
  return fallback;
}

