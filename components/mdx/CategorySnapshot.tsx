import Link from "next/link";
import {
  getCardCategory,
  getCategorySnapshotOnDate,
} from "@/lib/data/card-categories";
import { categorySlugSchema } from "@/lib/card-categories";
import SnapshotSummary from "./SnapshotSummary";

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
  return (
    <>
      <Link
        href={`/cardattack/categories/${category}`}
        prefetch={false}
        className="text-primary underline hover:no-underline"
      >
        {label}
      </Link>
      {snapshot ? (
        <>
          {" "}
          <SnapshotSummary
            ranking={snapshot.ranking}
            trend={snapshot.trend_overall}
            cardCount={snapshot.card_count}
          />
        </>
      ) : null}
    </>
  );
}
