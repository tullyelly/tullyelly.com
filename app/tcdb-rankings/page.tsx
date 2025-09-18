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

      <section className="space-y-4">
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I love me some{' '}
          <a href="https://www.tcdb.com" target="_blank" rel="noopener noreferrer">
            TCDb
          </a>
          , and as part of that I started to take snapshots of various portions of my PC so that I can keep an eye on if I am trending up or down on any given player when compared to the other wonderful collectors on TCDb. Eventually this will include more players and teams, and this is not a full list of players I PC - just an initial list of players that another project I am working on has come across.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          This is in the early MVP (minimum viable product) stages, so please let me know what you think.
        </p>
      </section>

      <Suspense fallback={<Card className="p-4 text-sm text-ink/70">Loading rankings…</Card>}>
        <TCDBRankingTable serverData={data} />
      </Suspense>
    </main>
  );
}
