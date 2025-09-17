import { Suspense } from 'react';
import TCDBRankingTable from '@/components/tcdb/TCDBRankingTable';
import { getBaseUrl } from '@/app/lib/getBaseUrl';
import { PAGE_SIZE_OPTIONS, coercePage, coercePageSize } from '@/lib/pagination';
import { Card } from '@ui';

export const revalidate = 300;

type Trend = 'up' | 'down' | 'flat';

type RankingRow = {
  homie_id: number;
  name: string;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
  rank_delta: number | null;
  diff_delta: number | null;
  trend_rank: Trend;
  trend_overall: Trend;
  diff_sign_changed: boolean;
};

type RankingResponse = {
  data: RankingRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    q?: string;
    trend?: Trend;
  };
};

type SearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  trend?: Trend;
};

type PageProps = {
  searchParams: Promise<SearchParams | undefined>;
};

async function fetchRankings(searchParams: SearchParams = {}): Promise<RankingResponse> {
  const base = getBaseUrl();
  const url = new URL('/api/tcdb-rankings', base);
  const allowedKeys: (keyof SearchParams)[] = ['page', 'pageSize', 'q', 'trend'];
  for (const key of allowedKeys) {
    const value = searchParams?.[key];
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    next: { revalidate: 300, tags: ['tcdb-rankings'] },
    headers: {
      'x-ssr-fetch': 'tcdb-rankings',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load rankings: ${response.status}`);
  }

  return (await response.json()) as RankingResponse;
}

export default async function Page({ searchParams }: PageProps) {
  const raw = (await searchParams) ?? {};
  const resolved: SearchParams = { ...raw };
  const pageSize = coercePageSize(resolved.pageSize, PAGE_SIZE_OPTIONS[0]);
  const page = coercePage(resolved.page, 1);
  const normalized: SearchParams = {
    ...resolved,
    page: String(page),
    pageSize: String(pageSize),
  };
  const data = await fetchRankings(normalized);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-3 text-2xl font-semibold">TCDB Rankings</h1>

      <div
        className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        data-testid="tcdb-intro-placeholder"
      >
        <p className="text-sm">
          TODO: Replace this text with a short description of how TCDB rankings and trends work in this app, including the
          definition of “difference,” how rank deltas are computed, and any caveats about data freshness.
        </p>
      </div>

      <Suspense fallback={<Card className="p-4 text-sm text-ink/70">Loading rankings…</Card>}>
        <TCDBRankingTable serverData={data} />
      </Suspense>
    </main>
  );
}
