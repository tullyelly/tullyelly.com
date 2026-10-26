import "server-only";
import { unstable_cache } from "next/cache";
import { queryRows } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import { isNextBuild } from "@/lib/env";
import { isDbSkipEnabled } from "@/lib/escape-hatches";
import {
  CATEGORY_CACHE_TAG,
  categorySlugSchema,
  isCalendarDate,
  type CategorySnapshot,
  type RecordedCategorySnapshot,
} from "@/lib/card-categories";

// Cast DATE to text at the SQL boundary; never convert it through a JS timestamp.
const columns = `category_id::text, slug, name, snapshot_id::text,
  measured_on::text, card_count, previous_date::text, previous_count, count_change, ranking, previous_ranking, rank_delta, trend_rank,
  difference, previous_difference, diff_delta::double precision AS diff_delta, trend_overall, diff_sign_changed`;
export class CategoryDataUnavailable extends Error {}
function assertReadable() {
  if (isNextBuild() || isDbSkipEnabled())
    throw new CategoryDataUnavailable("Category database reads are disabled");
}
const readOverview = unstable_cache(
  async () => {
    return withDbRetry(() =>
      queryRows<CategorySnapshot>(
        `SELECT ${columns} FROM dojo.v_card_category_current ORDER BY name, slug`,
      ),
    );
  },
  ["card-category-overview-v3"],
  { tags: [CATEGORY_CACHE_TAG], revalidate: 60 },
);
const readHistory = unstable_cache(
  async (slug: string) => {
    return withDbRetry(() =>
      queryRows<RecordedCategorySnapshot>(
        `SELECT ${columns} FROM dojo.v_card_category_snapshot WHERE slug = $1 ORDER BY measured_on`,
        [slug],
      ),
    );
  },
  ["card-category-history-v3"],
  { tags: [CATEGORY_CACHE_TAG], revalidate: 60 },
);
export async function listCardCategories() {
  assertReadable();
  return readOverview();
}
export async function getCardCategory(slug: string) {
  if (!categorySlugSchema.safeParse(slug).success) return null;
  return (
    (await listCardCategories()).find((category) => category.slug === slug) ??
    null
  );
}
export async function listCategoryHistory(slug: string) {
  assertReadable();
  if (!categorySlugSchema.safeParse(slug).success) return [];
  return readHistory(slug);
}
export async function getCategorySnapshotOnDate(slug: string, date: string) {
  const day = date.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
  if (!day || !isCalendarDate(day)) return null;
  return (
    (await listCategoryHistory(slug)).find((row) => row.measured_on === day) ??
    null
  );
}
