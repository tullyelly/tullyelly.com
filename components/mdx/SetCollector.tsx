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

const sportEmojis: Record<string, string> = {
  basketball: "🏀",
  baseball: "⚾",
  football: "🏈",
  "american football": "🏈",
  hockey: "🏒",
  "ice hockey": "🏒",
  soccer: "⚽",
  golf: "⛳",
  tennis: "🎾",
  racing: "🏎️",
  "auto racing": "🏎️",
  wrestling: "🤼",
  boxing: "🥊",
};

const linkClassName = "underline hover:no-underline text-primary";

function formatLatestProgress(
  cardsOwned: number | undefined,
  totalCards: number,
  percentComplete: number | undefined,
): string | undefined {
  if (
    cardsOwned === undefined ||
    percentComplete === undefined ||
    !Number.isFinite(cardsOwned) ||
    !Number.isFinite(totalCards) ||
    !Number.isFinite(percentComplete) ||
    totalCards <= 0
  ) {
    return undefined;
  }

  const percentLabel =
    cardsOwned >= totalCards
      ? "💯"
      : formatSetCollectorPercentComplete(percentComplete);

  return `${cardsOwned}/${totalCards}; ${percentLabel}`;
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

  const category = summary.categoryTag?.trim().toLowerCase();
  const sportEmoji =
    category && Object.hasOwn(sportEmojis, category)
      ? sportEmojis[category]
      : undefined;
  const visualPercent = latestProgress
    ? Math.min(
        100,
        Math.max(0, ((summary.cardsOwned ?? 0) / summary.totalCards) * 100),
      )
    : undefined;

  return (
    <>
      {sportEmoji ? (
        <>
          <span role="img" aria-label={category}>
            {sportEmoji}
          </span>{" "}
        </>
      ) : null}
      <Link
        href={getSetCollectorDetailHref(summary.setSlug)}
        prefetch={false}
        className={linkClassName}
      >
        {summary.setName}
      </Link>
      {!sportEmoji && category ? <span>{`, ${category}`}</span> : null}
      {latestProgress && visualPercent !== undefined ? (
        <>
          {" "}
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 align-middle">
            <span>{`(${latestProgress})`}</span>
            <span
              role="progressbar"
              aria-label={`${summary.setName} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={visualPercent}
              className="inline-flex h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--collector-progress-track)]"
            >
              <span
                className="h-full rounded-full"
                style={{
                  width: `${visualPercent}%`,
                  backgroundColor: `hsl(${visualPercent * 1.2} var(--collector-progress-saturation) var(--collector-progress-lightness))`,
                }}
              />
            </span>
          </span>
        </>
      ) : null}
    </>
  );
}
