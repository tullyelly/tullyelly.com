import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  getClanSnapshotsForTagOnDate,
  type ClanSnapshotRecord,
  type ClanSnapshotTrend,
} from "@/lib/data/tcdb-clan-snapshot";
import { getTcdbClanRankingHref } from "@/lib/tcdb-clan-routes";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import { getDefaultTagHref, normalizeTagSlug } from "@/lib/tags";

export type ClanSnapshotProps = {
  tag: string;
  snapshotDate: string;
  href?: string;
  sport?: string;
};

const TREND_EMOJI: Record<ClanSnapshotTrend, string> = {
  up: "↗️",
  down: "↘️",
  flat: "↔️",
};
const NEW_SNAPSHOT_EMOJI = "🆕";

const TREND_LABEL: Record<ClanSnapshotTrend, string> = {
  up: "Trending up",
  down: "Trending down",
  flat: "No change",
};
const NEW_SNAPSHOT_LABEL = "New snapshot";

const linkClassName = "underline hover:no-underline text-primary";
const clanTagClassName =
  "font-bold italic !text-[var(--person-tag-color,var(--blue))] !no-underline hover:!bg-[var(--person-tag-hover-bg,var(--blue))] hover:!text-[var(--person-tag-hover-color,var(--white))] hover:!no-underline";

function trimToValue(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

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

function isNewSnapshot(snapshot: ClanSnapshotRecord): boolean {
  return snapshot.trend === "flat" && snapshot.prevRanking === undefined;
}

function getTrendEmoji(snapshot: ClanSnapshotRecord): string {
  return isNewSnapshot(snapshot)
    ? NEW_SNAPSHOT_EMOJI
    : TREND_EMOJI[snapshot.trend];
}

function getTrendLabel(snapshot: ClanSnapshotRecord): string {
  return isNewSnapshot(snapshot)
    ? NEW_SNAPSHOT_LABEL
    : TREND_LABEL[snapshot.trend];
}

function ClanTag({
  displayName,
  href,
  tag,
}: {
  displayName?: string;
  href: string;
  tag: string;
}) {
  return (
    <Link
      href={href as Route}
      className={clanTagClassName}
      data-clan-tag={tag}
      prefetch={false}
    >
      {displayName ?? tag}
    </Link>
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
      <span aria-label={getTrendLabel(snapshot)} role="img">
        {getTrendEmoji(snapshot)}
      </span>{" "}
      <span>{`(${formatCardCount(snapshot.cardCount)})`}</span>
    </span>
  );
}

export default async function ClanSnapshot({
  href,
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
    return (
      <ClanTag
        href={trimToValue(href) ?? getDefaultTagHref(normalizedTag)}
        tag={normalizedTag}
      />
    );
  }

  const displayName = snapshots[0].displayName.toLowerCase();
  const clanHref = trimToValue(href) ?? getTcdbClanRankingHref(snapshots[0]);

  return (
    <>
      <ClanTag displayName={displayName} href={clanHref} tag={normalizedTag} />
      {snapshots.map(renderSnapshotSummary)}
    </>
  );
}
