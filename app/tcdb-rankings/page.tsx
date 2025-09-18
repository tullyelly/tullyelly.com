import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { Card } from '@ui';
import TCDBRankingTable from '@/components/tcdb/TCDBRankingTable';
import { listTcdbRankings, type RankingResponse, type Trend } from '@/lib/data/tcdb';
import { PAGE_SIZE_OPTIONS, coercePage, coercePageSize } from '@/lib/pagination';

// Keep ISR if you like; we're not self-fetching anymore.
export const revalidate = 300;

type SearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  trend?: Trend;
};

type PageProps = {
  searchParams: Promise<SearchParams | undefined>;
};

const readRankings = (page: number, pageSize: number, q?: string, trend?: Trend) =>
  unstable_cache(
    () => listTcdbRankings({ page, pageSize, q, trend }),
    ['tcdb-rankings', `p:${page}`, `ps:${pageSize}`, `q:${q ?? ''}`, `t:${trend ?? ''}`],
    { revalidate: 300, tags: ['tcdb-rankings'] }
  )();

export default async function Page({ searchParams }: PageProps) {
  const raw = (await searchParams) ?? {};
  const pageSize = coercePageSize(raw.pageSize, PAGE_SIZE_OPTIONS[0]);
  const page = coercePage(raw.page, 1);

  const data: RankingResponse = await readRankings(page, pageSize, raw.q, raw.trend);

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
