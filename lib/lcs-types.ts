export type LcsSummary = {
  slug: string;
  name: string;
  city?: string;
  state?: string;
  rating: number;
  url?: string;
  firstVisitDate?: string;
  latestVisitDate?: string;
  visitCount: number;
};

export type LcsDay = {
  visitDate: string;
};

export function normalizeLcsSlug(value: string | number): string {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  if (!normalized) {
    throw new Error("LCS lookup: slug must be a non-empty string.");
  }

  return normalized;
}
