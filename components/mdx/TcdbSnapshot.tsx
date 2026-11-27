import type { TagLinkMetadata } from "@/lib/tags";
import SnapshotSummary from "./SnapshotSummary";

import PersonTag from "@/components/mdx/PersonTag";
import { getTcdbSnapshotForTagOnDate } from "@/lib/data/tcdb-snapshot";
import { normalizeTagSlug } from "@/lib/tags";

export type TcdbSnapshotProps = {
  tag: string;
  snapshotDate: string;
  metadata?: TagLinkMetadata;
};

export default async function TcdbSnapshot({
  tag,
  snapshotDate,
  metadata,
}: TcdbSnapshotProps) {
  const normalizedTag = normalizeTagSlug(tag);

  if (!normalizedTag) {
    return null;
  }

  let snapshot: Awaited<ReturnType<typeof getTcdbSnapshotForTagOnDate>> = null;

  try {
    snapshot = await getTcdbSnapshotForTagOnDate(normalizedTag, snapshotDate);
  } catch (error) {
    console.error(
      `[tcdb-snapshot] failed to render "${normalizedTag}" on "${snapshotDate}"`,
      error,
    );
  }

  if (!snapshot) {
    return <PersonTag metadata={metadata} tag={normalizedTag} />;
  }

  const displayName = snapshot.displayName.toLowerCase();

  return (
    <>
      <PersonTag
        metadata={metadata}
        displayName={displayName}
        tag={normalizedTag}
      />
      ,{" "}
      <SnapshotSummary
        ranking={snapshot.ranking}
        rankHref={`/cardattack/homies/${encodeURIComponent(snapshot.routeSlug)}`}
        trend={snapshot.trendOverall}
        isNew={
          snapshot.trendOverall === "flat" && snapshot.prevRanking === undefined
        }
        cardCount={snapshot.cardCount}
      />
    </>
  );
}
