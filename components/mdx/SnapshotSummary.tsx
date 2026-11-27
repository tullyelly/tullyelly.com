import Link from "next/link";

type Trend = "up" | "down" | "flat";
const indicators = {
  up: { emoji: "↗️", label: "Trending up" },
  down: { emoji: "↘️", label: "Trending down" },
  flat: { emoji: "↔️", label: "No change" },
};

function formatOrdinal(value: number): string {
  const remainder = value % 100;
  const suffix =
    remainder >= 11 && remainder <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th");
  return `${value}${suffix}`;
}

export default function SnapshotSummary({
  ranking,
  rankHref,
  trend,
  isNew = false,
  cardCount,
}: {
  ranking?: number | null;
  rankHref?: string;
  trend?: Trend | null;
  isNew?: boolean;
  cardCount: number;
}) {
  const indicator =
    isNew || trend == null
      ? { emoji: "🆕", label: "New snapshot" }
      : indicators[trend];
  return (
    <>
      {ranking != null ? (
        <>
          <span>[</span>
          {rankHref ? (
            <Link
              href={rankHref}
              prefetch={false}
              className="underline hover:no-underline text-primary"
            >
              {formatOrdinal(ranking)}
            </Link>
          ) : (
            <span>{formatOrdinal(ranking)}</span>
          )}
          <span>]</span>{" "}
        </>
      ) : null}
      <span role="img" aria-label={indicator.label}>
        {indicator.emoji}
      </span>{" "}
      <span>{`(${new Intl.NumberFormat("en-US").format(cardCount)} ${cardCount === 1 ? "card" : "cards"})`}</span>
    </>
  );
}
