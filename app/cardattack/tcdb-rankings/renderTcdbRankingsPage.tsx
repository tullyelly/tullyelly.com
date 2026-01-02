import { unstable_cache } from "next/cache";
import { canCurrentUser as can } from "@/lib/authz";
import {
  listTcdbRankings,
  type RankingResponse,
  type Trend,
} from "@/lib/data/tcdb";
import {
  PAGE_SIZE_OPTIONS,
  coercePage,
  coercePageSize,
} from "@/lib/pagination";
import { getHomieOptions } from "./_lib/getHomieOptions";
import { getCurrentDateIso } from "./_lib/getCurrentDate";
import TcdbRankingsView from "./_components/TcdbRankingsView";

export type SearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  trend?: Trend;
};

const readRankings = (
  page: number,
  pageSize: number,
  q?: string,
  trend?: Trend,
) =>
  unstable_cache(
    () => listTcdbRankings({ page, pageSize, q, trend }),
    [
      "tcdb-rankings",
      `p:${page}`,
      `ps:${pageSize}`,
      `q:${q ?? ""}`,
      `t:${trend ?? ""}`,
    ],
    { revalidate: 300, tags: ["tcdb-rankings"] },
  )();

export async function renderTcdbRankingsPage(
  searchParams: Promise<SearchParams | undefined>,
) {
  const raw = (await searchParams) ?? {};
  const pageSize = coercePageSize(raw.pageSize, PAGE_SIZE_OPTIONS[0]);
  const page = coercePage(raw.page, 1);

  const data: RankingResponse = await readRankings(
    page,
    pageSize,
    raw.q,
    raw.trend,
  );
  const canCreate = await can("tcdb.snapshot.create");
  const homieOptions = await getHomieOptions();
  const defaultRankingDate =
    (await getCurrentDateIso()) || data.data[0]?.ranking_at || "";

  return (
    <div className="space-y-10">
      <TcdbRankingsView
        canCreate={canCreate}
        homieOptions={homieOptions}
        data={data}
        defaultRankingDate={defaultRankingDate}
      />
    </div>
  );
}
