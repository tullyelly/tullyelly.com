import Link from "next/link";

import {
  getSetCollectorDetailHref,
  getSetCollectorSummaryRow,
} from "@/lib/set-collector-content";
import {
  formatSetCollectorPercentComplete,
  normalizeSetCollectorSlug,
} from "@/lib/set-collector-types";

export type SetCollectorProps = {
  set: string | number;
  snapshotDate?: string;
};

const linkClassName = "underline hover:no-underline text-primary";

function formatLatestProgress(
  cardsOwned: number | undefined,
  totalCards: number,
  percentComplete: number | undefined,
): string | undefined {
  if (cardsOwned === undefined || percentComplete === undefined) {
    return undefined;
  }

  return `${cardsOwned}/${totalCards}; ${formatSetCollectorPercentComplete(percentComplete)}`;
}

export default async function SetCollector({
  set,
  snapshotDate,
}: SetCollectorProps) {
  let normalizedSlug: string;

  try {
    normalizedSlug = normalizeSetCollectorSlug(set);
  } catch {
    return null;
  }

  let summary: Awaited<ReturnType<typeof getSetCollectorSummaryRow>> = null;

  try {
    summary = await getSetCollectorSummaryRow(normalizedSlug, snapshotDate);
  } catch (error) {
    console.error(
      `[set-collector] failed to render set "${normalizedSlug}"${snapshotDate ? ` on "${snapshotDate}"` : ""}`,
      error,
    );
    return null;
  }

  if (!summary) {
    return null;
  }

  const latestProgress = formatLatestProgress(
    summary.cardsOwned,
    summary.totalCards,
    summary.percentComplete,
  );

  return (
    <>
      <Link
        href={getSetCollectorDetailHref(summary.setSlug)}
        prefetch={false}
        className={linkClassName}
      >
        {summary.setName}
      </Link>
      {latestProgress ? <span>{` (${latestProgress})`}</span> : null}
    </>
  );
}
