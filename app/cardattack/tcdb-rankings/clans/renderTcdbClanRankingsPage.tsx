import { Card } from "@ui";
import { unstable_cache } from "next/cache";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import RankingListNav from "@/components/tcdb/RankingListNav";
import TCDBRankingTable, {
  clanRankingsToTableData,
} from "@/components/tcdb/TCDBRankingTable";
import {
  listTcdbClanRankings,
  type ClanRankingResponse,
} from "@/lib/data/tcdb-clans";
import type { Trend } from "@/lib/data/tcdb";
import {
  PAGE_SIZE_OPTIONS,
  coercePage,
  coercePageSize,
} from "@/lib/pagination";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";

export type ClanSearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  trend?: Trend;
};

const readClanRankings = (
  page: number,
  pageSize: number,
  q?: string,
  trend?: Trend,
) =>
  unstable_cache(
    () => listTcdbClanRankings({ page, pageSize, q, trend }),
    [
      "tcdb-rankings-clans",
      `p:${page}`,
      `ps:${pageSize}`,
      `q:${q ?? ""}`,
      `t:${trend ?? ""}`,
    ],
    { revalidate: 300, tags: ["tcdb-rankings", "tcdb-rankings-clans"] },
  )();

export async function renderTcdbClanRankingsPage(
  searchParams: Promise<ClanSearchParams | undefined>,
) {
  const raw = (await searchParams) ?? {};
  const pageSize = coercePageSize(raw.pageSize, PAGE_SIZE_OPTIONS[0]);
  const page = coercePage(raw.page, 1);

  const data: ClanRankingResponse = await readClanRankings(
    page,
    pageSize,
    raw.q,
    raw.trend,
  );

  return (
    <FullBleedPage articleClassName="md:max-w-[var(--content-max)]">
      <Card
        as="section"
        className="border-0 px-1 pb-6 pt-0 shadow-none md:px-8 md:pb-8 md:pt-0"
      >
        <div className="space-y-8">
          <PageIntro title="TCDB Clan Rankings">
            <RankingListNav current="clans" />
            <p className="text-[16px] text-muted-foreground md:text-[18px]">
              Clan snapshots track clan collections by slug, card count, and
              current TCDb rank.
            </p>
          </PageIntro>

          <TCDBRankingTable
            serverData={clanRankingsToTableData(data)}
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
        </div>
      </Card>
    </FullBleedPage>
  );
}
