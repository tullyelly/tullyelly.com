import { unstable_cache } from "next/cache";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import TCDBRankingTable, {
  clanRankingsToTableData,
} from "@/components/tcdb/TCDBRankingTable";
import {
  getTcdbClanCollectionScoreboard,
  listTcdbClanRankings,
  type ClanRankingResponse,
} from "@/lib/data/tcdb-clans";
import { isTrend } from "@/lib/data/tcdb";
import {
  PAGE_SIZE_OPTIONS,
  coercePage,
  coercePageSize,
} from "@/lib/pagination";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";
import {
  tcdbTradePageThemeVars,
  tcdbTradeTableThemeStyle,
} from "@/lib/tcdb-theme";
import ClanCollectionScoreboard from "./_components/ClanCollectionScoreboard";

export type ClanSearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  sport?: string;
  trend?: string;
};

const readClanRankings = (
  page: number,
  pageSize: number,
  q?: string,
  sport?: string,
  trend?: "up" | "down" | "flat",
) =>
  unstable_cache(
    () => listTcdbClanRankings({ page, pageSize, q, sport, trend }),
    [
      "clan-ranking-data",
      `p:${page}`,
      `ps:${pageSize}`,
      `q:${q ?? ""}`,
      `s:${sport ?? ""}`,
      `t:${trend ?? ""}`,
    ],
    { revalidate: 300, tags: ["tcdb-ranking-data", "clan-ranking-data"] },
  )();

const readClanCollectionScoreboard = unstable_cache(
  getTcdbClanCollectionScoreboard,
  ["clan-collection-scoreboard"],
  { revalidate: 300, tags: ["tcdb-ranking-data", "clan-ranking-data"] },
);

export async function renderTcdbClanRankingsPage(
  searchParams: Promise<ClanSearchParams | undefined>,
) {
  const raw = (await searchParams) ?? {};
  const pageSize = coercePageSize(raw.pageSize, PAGE_SIZE_OPTIONS[0]);
  const page = coercePage(raw.page, 1);
  const sport = raw.sport?.trim().toLowerCase() || undefined;
  const trend = isTrend(raw.trend) ? raw.trend : undefined;

  const [data, scoreboard]: [
    ClanRankingResponse,
    Awaited<ReturnType<typeof getTcdbClanCollectionScoreboard>>,
  ] = await Promise.all([
    readClanRankings(page, pageSize, raw.q, sport, trend),
    readClanCollectionScoreboard(),
  ]);

  return (
    <DataPageShell contentClassName="space-y-8">
      <div style={tcdbTradePageThemeVars} className="space-y-8">
        <PageIntro
          title="Clans"
          description="Team collections across CardAttack, with current TCDb rankings and collection growth in one place."
        />

        <ClanCollectionScoreboard summary={scoreboard} />

        <section aria-labelledby="clan-rankings-heading" className="space-y-4">
          <SectionHeader
            id="clan-rankings-heading"
            eyebrow="collection directory"
            title="Clan Rankings"
            eyebrowClassName="text-[color:var(--trade-rust-deep)]/80"
            titleClassName="text-[color:var(--trade-charcoal)]"
          />

          <TCDBRankingTable
            serverData={clanRankingsToTableData(data)}
            sportOptions={scoreboard.sports.map((value) => ({
              value,
              label: formatClanSportLabel(value),
            }))}
            labels={{
              searchPlaceholder: "Search clans",
              searchAriaLabel: "Search clans",
              identifierColumn: "Sport",
              emptyMessage: "No clan rankings match your filters.",
              tableAriaLabel: "TCDB clan rankings table",
            }}
            theme={{
              tableThemeStyle: tcdbTradeTableThemeStyle,
            }}
          />
        </section>
      </div>
    </DataPageShell>
  );
}
