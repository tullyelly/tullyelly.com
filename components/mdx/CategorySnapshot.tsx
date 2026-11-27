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
        ...(snapshot.count_change == null
          ? []
          : [formatCategoryChange(snapshot.count_change)]),
        ...(snapshot.ranking == null
          ? []
          : [
              `TCDb ${formatCategoryRanking(snapshot.ranking)}`,
              ...(snapshot.rank_delta == null
                ? []
                : [formatCategoryRankChange(snapshot.rank_delta)]),
              ...(snapshot.trend_rank == null
                ? []
                : [`rank trend ${snapshot.trend_rank}`]),
            ]),
        ...(snapshot.difference == null
          ? []
          : [
              `difference ${formatCategoryDifference(snapshot.difference)}`,
              ...(snapshot.diff_delta == null
                ? []
                : [
                    `difference change ${formatCategoryDifferenceChange(snapshot.diff_delta)}`,
                  ]),
              ...(snapshot.diff_sign_changed == null
                ? []
                : [
                    `difference sign changed ${formatCategorySignChange(snapshot.diff_sign_changed).toLowerCase()}`,
                  ]),
            ]),
        ...((snapshot.ranking == null && snapshot.difference == null) ||
        snapshot.trend_overall == null
          ? []
          : [`overall trend ${snapshot.trend_overall}`]),
        ...([
          snapshot.count_change,
          snapshot.rank_delta,
          snapshot.diff_delta,
          snapshot.trend_rank,
          snapshot.trend_overall,
          snapshot.diff_sign_changed,
        ].every((value) => value == null)
          ? ["Comparison unavailable"]
          : []),
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
