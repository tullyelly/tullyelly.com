import Link from "next/link";
import type { ReactNode } from "react";

import {
  getClanSnapshotsForTagOnDate,
  type ClanSnapshotRecord,
  type ClanSnapshotTrend,
} from "@/lib/data/tcdb-clan-snapshot";
import { getTcdbClanRankingHref } from "@/lib/tcdb-clan-routes";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import { normalizeTagSlug } from "@/lib/tags";

export type ClanSnapshotProps = {
  tag: string;
  snapshotDate: string;
  sport?: string;
};

const TREND_EMOJI: Record<ClanSnapshotTrend, string> = {
  up: "↗️",
  down: "↘️",
  flat: "↔️",
};

const TREND_LABEL: Record<ClanSnapshotTrend, string> = {
  up: "Trending up",
  down: "Trending down",
  flat: "No change",
};

const linkClassName = "underline hover:no-underline text-primary";

function formatOrdinal(value: number): string {
  const remainder100 = value % 100;

  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function formatCardCount(value: number): string {
  return `${value} ${value === 1 ? "card" : "cards"}`;
}

function ClanTag({
  displayName,
  tag,
}: {
  displayName?: string;
  tag: string;
}) {
  return (
    <i className="font-bold italic text-[var(--blue)]" data-clan-tag={tag}>
      {displayName ?? tag}
    </i>
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
      <span>{sportLabel}</span> <span>[</span>
      <Link
        href={getTcdbClanRankingHref(snapshot)}
        prefetch={false}
        className={linkClassName}
      >
        {formatOrdinal(snapshot.ranking)}
      </Link>
      <span>]</span>{" "}
      <span aria-label={TREND_LABEL[snapshot.trend]} role="img">
        {TREND_EMOJI[snapshot.trend]}
      </span>{" "}
      <span>{`(${formatCardCount(snapshot.cardCount)})`}</span>
    </span>
  );
}

export default async function ClanSnapshot({
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
    return <ClanTag tag={normalizedTag} />;
  }

  const displayName = snapshots[0].displayName.toLowerCase();

  return (
    <>
      <ClanTag displayName={displayName} tag={normalizedTag} />
      {snapshots.map(renderSnapshotSummary)}
    </>
  );
}
