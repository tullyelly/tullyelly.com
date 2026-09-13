import type { ClanCollectionScoreboard as ClanCollectionScoreboardData } from "@/lib/data/tcdb-clans";
import { Stat, StatGrid } from "@/components/ui/StatGrid";

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
      <StatGrid columns={4} variant="segmented">
        {stats.map((stat) => (
          <Stat
            key={stat.label}
            variant="segmented"
            label={stat.label}
            value={integerFormatter.format(stat.value)}
            valueClassName="break-words leading-none"
          />
        ))}
      </StatGrid>
    </section>
  );
}
