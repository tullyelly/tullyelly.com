import type { ClanCollectionScoreboard as ClanCollectionScoreboardData } from "@/lib/data/tcdb-clans";

type ClanCollectionScoreboardProps = {
  summary: ClanCollectionScoreboardData;
};

const integerFormatter = new Intl.NumberFormat("en-US");

export default function ClanCollectionScoreboard({
  summary,
}: ClanCollectionScoreboardProps) {
  const stats = [
    { label: "Clans", value: summary.tracked_clans },
    { label: "Cards", value: summary.total_current_cards },
    { label: "#1 Rankings", value: summary.number_one_rankings },
    { label: "Sports", value: summary.sports.length },
  ];

  return (
    <section aria-label="Clan collection scoreboard">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--border-subtle)] md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 bg-[color:var(--surface-card)] px-3 py-3 sm:px-4"
          >
            <dt className="text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.16em] text-ink/60 md:text-[0.72rem]">
              {stat.label}
            </dt>
            <dd className="mt-1.5 break-words text-lg font-semibold leading-none tabular-nums text-ink md:text-xl">
              {integerFormatter.format(stat.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
