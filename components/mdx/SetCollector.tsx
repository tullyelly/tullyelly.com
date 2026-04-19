import Link from "next/link";

import {
  getSetCollectorDetailHref,
  getSetCollectorSummaryRow,
} from "@/lib/set-collector-content";
import {
  formatSetCollectorPercentComplete,
  normalizeSetCollectorId,
} from "@/lib/set-collector-types";

export type SetCollectorProps = {
  id: string | number;
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

export default async function SetCollector({ id }: SetCollectorProps) {
  let normalizedId: number;

  try {
    normalizedId = normalizeSetCollectorId(id);
  } catch {
    return null;
  }

  let summary: Awaited<ReturnType<typeof getSetCollectorSummaryRow>> = null;

  try {
    summary = await getSetCollectorSummaryRow(normalizedId);
  } catch (error) {
    console.error(`[set-collector] failed to render set "${normalizedId}"`, error);
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
        href={getSetCollectorDetailHref(summary.id)}
        prefetch={false}
        className={linkClassName}
      >
        {summary.setName}
      </Link>
      {latestProgress ? <span>{` (${latestProgress})`}</span> : null}
      {summary.tcdbTradeId ? (
        <>
          <span className="text-muted-foreground">{"; trade "}</span>
          <Link
            href={`/cardattack/tcdb-trades/${encodeURIComponent(summary.tcdbTradeId)}`}
            prefetch={false}
            className={linkClassName}
          >
            {summary.tcdbTradeId}
          </Link>
        </>
      ) : null}
    </>
  );
}
