import { Card } from "@ui";
import { unstable_cache } from "next/cache";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
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
    <FullBleedPage articleClassName="md:max-w-[var(--content-max)]">
      <Card
        as="section"
        className="border-0 px-1 pb-6 pt-0 shadow-none md:px-8 md:pb-8 md:pt-0"
        style={tcdbTradePageThemeVars}
      >
        <div className="space-y-8">
          <PageIntro title="Clans">
            <p className="text-[16px] text-muted-foreground md:text-[18px]">
              Team collections across CardAttack, with current TCDb rankings and
              collection growth in one place.
            </p>
          </PageIntro>

          <ClanCollectionScoreboard summary={scoreboard} />

          <section
            aria-labelledby="clan-rankings-heading"
            className="space-y-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--trade-rust-deep)]/80">
                collection directory
              </p>
              <h2
                id="clan-rankings-heading"
                className="text-2xl font-semibold leading-tight text-[color:var(--trade-charcoal)]"
              >
                Clan Rankings
              </h2>
            </div>

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
      </Card>
    </FullBleedPage>
  );
}
