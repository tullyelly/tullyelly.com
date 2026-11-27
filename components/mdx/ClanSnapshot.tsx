import TagLink from "@/components/tags/TagLink";
import type { TagLinkMetadata } from "@/lib/tags";
import SnapshotSummary from "./SnapshotSummary";
import type { ReactNode } from "react";

import {
  getClanSnapshotsForTagOnDate,
  type ClanSnapshotRecord,
} from "@/lib/data/tcdb-clan-snapshot";
import { getTcdbClanRankingHref } from "@/lib/tcdb-clan-routes";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import { normalizeTagSlug } from "@/lib/tags";

export type ClanSnapshotProps = {
  tag: string;
  snapshotDate: string;
  href?: string;
  metadata?: TagLinkMetadata;
  sport?: string;
};

const clanTagClassName =
  "font-bold italic !text-[var(--person-tag-color,var(--blue))] !no-underline hover:!bg-[var(--person-tag-hover-bg,var(--blue))] hover:!text-[var(--person-tag-hover-color,var(--white))] hover:!no-underline";

function ClanTag({
  displayName,
  metadata,
  tag,
}: {
  displayName?: string;
  metadata?: TagLinkMetadata;
  tag: string;
}) {
  return (
    <TagLink
      tag={tag}
      metadata={metadata}
      className={clanTagClassName}
      data-clan-tag={tag}
      prefetch={false}
    >
      {displayName ?? tag}
    </TagLink>
  );
}

function renderSnapshotSummary(
  snapshot: ClanSnapshotRecord,
  index: number,
): ReactNode {
  const sportLabel = formatClanSportLabel(snapshot.sport).toLowerCase();

  return (
    <span key={`${snapshot.slug}-${snapshot.sport}`}>
      {index === 0 ? ", " : "; "}
      <span>{sportLabel}</span>{" "}
      <SnapshotSummary
        ranking={snapshot.ranking}
        rankHref={getTcdbClanRankingHref(snapshot)}
        trend={snapshot.trendOverall}
        isNew={
          snapshot.trendOverall === "flat" && snapshot.prevRanking === undefined
        }
        cardCount={snapshot.cardCount}
      />
    </span>
  );
}

export default async function ClanSnapshot({
  metadata,
  tag,
  snapshotDate,
  sport,
}: ClanSnapshotProps) {
  const normalizedTag = normalizeTagSlug(tag);

  if (!normalizedTag) {
    return null;
  }

  let snapshots: Awaited<ReturnType<typeof getClanSnapshotsForTagOnDate>> = [];

  try {
    snapshots = await getClanSnapshotsForTagOnDate(
      normalizedTag,
      snapshotDate,
      sport,
    );
  } catch (error) {
    console.error(
      `[clan-snapshot] failed to render "${normalizedTag}" on "${snapshotDate}"`,
      error,
    );
  }

  if (snapshots.length === 0) {
    return <ClanTag metadata={metadata} tag={normalizedTag} />;
  }

  const displayName = snapshots[0].displayName.toLowerCase();

  return (
    <>
      <ClanTag
        displayName={displayName}
        metadata={metadata}
        tag={normalizedTag}
      />
      {snapshots.map(renderSnapshotSummary)}
    </>
  );
}
