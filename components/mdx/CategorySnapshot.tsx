import Link from "next/link";
import {
  getCardCategory,
  getCategorySnapshotOnDate,
} from "@/lib/data/card-categories";
import {
  categorySlugSchema,
  formatCategoryChange,
  formatCategoryCount,
  formatCategoryRanking,
  formatCategoryRankChange,
  formatCategoryDifference,
  formatCategoryDifferenceChange,
  formatCategorySignChange,
} from "@/lib/card-categories";

export type CategorySnapshotProps = { category: string; snapshotDate: string };
export default async function CategorySnapshot({
  category,
  snapshotDate,
}: CategorySnapshotProps) {
  if (!categorySlugSchema.safeParse(category).success) return null;
  let label = category;
  let snapshot: Awaited<ReturnType<typeof getCategorySnapshotOnDate>> = null;
  try {
    const [identity, measurement] = await Promise.all([
      getCardCategory(category),
      getCategorySnapshotOnDate(category, snapshotDate),
    ]);
    label = identity?.name ?? category;
    snapshot = measurement;
  } catch {
    // Linked identity is still useful during initial migration or a database outage.
  }
  const summary = snapshot
    ? [
        `${formatCategoryCount(snapshot.card_count)} cards on ${snapshot.measured_on}`,
        formatCategoryChange(snapshot.count_change),
        ...(snapshot.ranking == null
          ? []
          : [
              `TCDb ${formatCategoryRanking(snapshot.ranking)}`,
              formatCategoryRankChange(snapshot.rank_delta),
              `rank trend ${snapshot.trend_rank ?? "no comparison"}`,
            ]),
        ...(snapshot.difference == null
          ? []
          : [
              `difference ${formatCategoryDifference(snapshot.difference)}`,
              `difference change ${formatCategoryDifferenceChange(snapshot.diff_delta)}`,
              `difference sign changed ${formatCategorySignChange(snapshot.diff_sign_changed).toLowerCase()}`,
            ]),
        ...(snapshot.ranking == null && snapshot.difference == null
          ? []
          : [`overall trend ${snapshot.trend_overall ?? "no comparison"}`]),
      ].join("; ")
    : null;
  return (
    <>
      <Link
        href={`/cardattack/categories/${category}`}
        prefetch={false}
        className="text-primary underline hover:no-underline"
      >
        {label}
      </Link>
      {summary ? <span>{` (${summary})`}</span> : null}
    </>
  );
}
