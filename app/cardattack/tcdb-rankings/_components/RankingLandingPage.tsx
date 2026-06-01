import Link from "next/link";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import RankingListNav from "@/components/tcdb/RankingListNav";
import TrendPill from "@/components/tcdb/TrendPill";
import type { RankingRow } from "@/lib/data/tcdb";
import type { ClanRankingRow } from "@/lib/data/tcdb-clans";
import { fmtDate } from "@/lib/datetime";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";

export type RankingLandingSummary = {
  numberOneHomies: RankingRow[];
  numberOneClans: ClanRankingRow[];
  topHomies: RankingRow[];
  topClans: ClanRankingRow[];
  homieRisers: RankingRow[];
  homieFallers: RankingRow[];
  clanRisers: ClanRankingRow[];
  clanFallers: ClanRankingRow[];
};

type LandingItem = {
  key: string;
  name: string;
  href: string;
  detail: string;
  cardCount: number;
  ranking: number;
  rankingAt: string;
  rankDelta: number | null;
  diffDelta: number | null;
  trend: "up" | "down" | "flat";
};

const integerFormatter = new Intl.NumberFormat("en-US");
const signedFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "always",
});

function homieItem(row: RankingRow): LandingItem {
  return {
    key: `homie-${row.homie_id}`,
    name: row.name,
    href: `/cardattack/tcdb-rankings/${row.homie_id}`,
    detail: `Jersey ${row.homie_id}`,
    cardCount: row.card_count,
    ranking: row.ranking,
    rankingAt: row.ranking_at,
    rankDelta: row.rank_delta,
    diffDelta: row.diff_delta,
    trend: row.trend_overall,
  };
}

function clanItem(row: ClanRankingRow): LandingItem {
  return {
    key: `clan-${row.slug}-${row.sport}`,
    name: row.name,
    href: `/cardattack/tcdb-rankings/clans/${row.slug}`,
    detail: `${row.slug}; ${formatClanSportLabel(row.sport)}`,
    cardCount: row.card_count,
    ranking: row.ranking,
    rankingAt: row.ranking_at,
    rankDelta: row.rank_delta,
    diffDelta: row.diff_delta,
    trend: row.trend_overall,
  };
}

function formatDelta(value: number | null): string {
  return value === null ? "Not available" : signedFormatter.format(value);
}

function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function RankingLandingSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: LandingItem[];
  empty: string;
}) {
  const id = sectionId(title);

  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id={id} className="text-xl font-semibold text-ink">
          {title}
        </h3>
      </div>
      {items.length > 0 ? (
        <ul className="grid gap-3">
          {items.map((item) => (
            <Card
              as="li"
              key={item.key}
              className="border-[color:var(--trade-border)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="link-blue block truncate font-semibold"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink/70">{item.detail}</p>
                </div>
                <TrendPill trend={item.trend} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase text-ink/60">Rank</dt>
                  <dd className="tabular-nums text-ink">
                    {integerFormatter.format(item.ranking)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-ink/60">Cards</dt>
                  <dd className="tabular-nums text-ink">
                    {integerFormatter.format(item.cardCount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-ink/60">Rank Delta</dt>
                  <dd className="tabular-nums text-ink">
                    {formatDelta(item.rankDelta)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-ink/60">Updated</dt>
                  <dd className="text-ink">{fmtDate(item.rankingAt)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-ink/70">
                Difference delta: {formatDelta(item.diffDelta)}
              </p>
            </Card>
          ))}
        </ul>
      ) : (
        <Card className="border-[color:var(--trade-border)] p-3 text-sm text-ink/70">
          {empty}
        </Card>
      )}
    </section>
  );
}

export default function RankingLandingPage({
  summary,
}: {
  summary: RankingLandingSummary;
}) {
  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={tcdbTradePageThemeVars}
      >
        <PageIntro title="TCDB Rankings">
          <RankingListNav current="overview" />
          <p className="text-[16px] text-muted-foreground md:text-[18px]">
            Current TCDb snapshots for homies and clans on tullyelly.com.
          </p>
        </PageIntro>

        <section className="space-y-4" aria-labelledby="number-one-collectors">
          <h2
            id="number-one-collectors"
            className="text-2xl font-semibold text-ink"
          >
            #1 Collectors
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankingLandingSection
              title="#1 Homies"
              items={summary.numberOneHomies.map(homieItem)}
              empty="No #1 homies are available yet."
            />
            <RankingLandingSection
              title="#1 Clans"
              items={summary.numberOneClans.map(clanItem)}
              empty="No #1 clans are available yet."
            />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="top-five-overall">
          <h2 id="top-five-overall" className="text-2xl font-semibold text-ink">
            Top 5 Overall
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankingLandingSection
              title="Top 5 Homies"
              items={summary.topHomies.map(homieItem)}
              empty="No homie rankings are available yet."
            />
            <RankingLandingSection
              title="Top 5 Clans"
              items={summary.topClans.map(clanItem)}
              empty="No clan rankings are available yet."
            />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="recent-movers">
          <h2 id="recent-movers" className="text-2xl font-semibold text-ink">
            Recent Risers and Fallers
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankingLandingSection
              title="Homie Risers"
              items={summary.homieRisers.map(homieItem)}
              empty="No homie risers are available yet."
            />
            <RankingLandingSection
              title="Homie Fallers"
              items={summary.homieFallers.map(homieItem)}
              empty="No homie fallers are available yet."
            />
            <RankingLandingSection
              title="Clan Risers"
              items={summary.clanRisers.map(clanItem)}
              empty="No clan risers are available yet."
            />
            <RankingLandingSection
              title="Clan Fallers"
              items={summary.clanFallers.map(clanItem)}
              empty="No clan fallers are available yet."
            />
          </div>
        </section>
      </div>
    </FullBleedPage>
  );
}
