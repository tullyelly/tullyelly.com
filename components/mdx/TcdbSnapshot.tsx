import Link from "next/link";

import PersonTag from "@/components/mdx/PersonTag";
import {
  getTcdbSnapshotForTagOnDate,
  type TcdbSnapshotTrend,
} from "@/lib/data/tcdb-snapshot";
import { normalizeTagSlug } from "@/lib/tags";

export type TcdbSnapshotProps = {
  tag: string;
  snapshotDate: string;
};

const TREND_EMOJI: Record<TcdbSnapshotTrend, string> = {
  up: "↗️",
  down: "↘️",
  flat: "↔️",
};

const TREND_LABEL: Record<TcdbSnapshotTrend, string> = {
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

export default async function TcdbSnapshot({
  tag,
  snapshotDate,
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
    return <PersonTag tag={normalizedTag} />;
  }

  const displayName = snapshot.displayName.toLowerCase();

  return (
    <>
      <PersonTag displayName={displayName} tag={normalizedTag} />,{" "}
      <span>[</span>
      <Link
        href={`/cardattack/tcdb-rankings/${encodeURIComponent(snapshot.homieId)}`}
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
    </>
  );
}
