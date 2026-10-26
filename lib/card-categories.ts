import { z } from "zod";
import { parseDateish } from "@/lib/datetime";

export const CATEGORY_CACHE_TAG = "card-category-snapshots";
export const MAX_CARD_COUNT = 2147483647;
export const MIN_CATEGORY_DIFFERENCE = -2147483648;
export const categoryDifferenceSchema = z
  .number()
  .int()
  .min(MIN_CATEGORY_DIFFERENCE)
  .max(MAX_CARD_COUNT)
  .nullable()
  .optional();
export const categorySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);

export function chicagoToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((entry) => entry.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0100-01-01") return false;
  const date = parseDateish(value);
  return date !== null && date.toISOString().slice(0, 10) === value;
}

export const categoryRankingSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_CARD_COUNT)
  .nullable()
  .optional();

export const countSchema = z.number().int().min(0).max(MAX_CARD_COUNT);
export const createCategorySnapshotSchema = z
  .object({
    category: categorySlugSchema,
    measured_on: z
      .string()
      .refine(isCalendarDate, "Select a real calendar date")
      .refine(
        (value) => value <= chicagoToday(),
        "Future measurements are not allowed",
      ),
    card_count: countSchema,
    ranking: categoryRankingSchema,
    difference: categoryDifferenceSchema,
  })
  .strict();
export const correctCategorySnapshotSchema = z
  .object({
    snapshot_id: z
      .string()
      .regex(/^[1-9]\d{0,18}$/)
      .refine(
        (value) =>
          /^[1-9]\d{0,18}$/.test(value) &&
          BigInt(value) <= BigInt("9223372036854775807"),
      ),
    card_count: countSchema,
    ranking: categoryRankingSchema,
    difference: categoryDifferenceSchema,
  })
  .strict();

export type CreateCategorySnapshot = z.infer<
  typeof createCategorySnapshotSchema
>;
export type CorrectCategorySnapshot = z.infer<
  typeof correctCategorySnapshotSchema
>;
export type CategorySnapshot = {
  category_id: string;
  slug: string;
  name: string;
  snapshot_id: string | null;
  measured_on: string | null;
  card_count: number | null;
  previous_date: string | null;
  previous_count: number | null;
  count_change: number | null;
  ranking: number | null;
  previous_ranking: number | null;
  rank_delta: number | null;
  trend_rank: "up" | "down" | "flat" | null;
  difference: number | null;
  previous_difference: number | null;
  diff_delta: number | null;
  trend_overall: "up" | "down" | "flat" | null;
  diff_sign_changed: boolean | null;
};
export type RecordedCategorySnapshot = CategorySnapshot & {
  snapshot_id: string;
  measured_on: string;
  card_count: number;
};
export function formatCategoryChange(value: number | null): string {
  return value === null
    ? "No previous measurement"
    : new Intl.NumberFormat("en-US", { signDisplay: "always" }).format(value);
}

export const formatCategoryCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export function formatCategoryRanking(
  value: number | null | undefined,
): string {
  return value == null ? "Not recorded" : `#${formatCategoryCount(value)}`;
}
export function formatCategoryRankChange(
  value: number | null | undefined,
): string {
  if (value == null) return "No rank comparison";
  if (value === 0) return "Rank unchanged";
  return `${value > 0 ? "Up" : "Down"} ${formatCategoryCount(Math.abs(value))} ${Math.abs(value) === 1 ? "place" : "places"}`;
}

export function formatCategoryDifference(
  value: number | null | undefined,
): string {
  return value == null
    ? "Not recorded"
    : new Intl.NumberFormat("en-US", { signDisplay: "always" }).format(value);
}
export function formatCategoryDifferenceChange(
  value: number | null | undefined,
): string {
  return value == null
    ? "No difference comparison"
    : formatCategoryDifference(value);
}
export function formatCategorySignChange(
  value: boolean | null | undefined,
): string {
  return value == null ? "No difference comparison" : value ? "Yes" : "No";
}
