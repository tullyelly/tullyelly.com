import { getReleases, ORDER_BY, type Sort } from '@/lib/releases';
import type { Release } from './_components/ScrollsTableClient';
import ScrollsTableServer from './_components/ScrollsTableServer';
import { serverEnv } from '@/lib/env/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string; sort?: string; q?: string }>;
}

function parseSearchParams(params: PageProps['searchParams']): Promise<{ limit: number; offset: number; sort: Sort; q?: string }> {
  return params.then((p = {}) => {
    const limitNum = Number.parseInt(p.limit ?? '', 10);
    const limit = Math.min(Math.max(Number.isNaN(limitNum) ? 20 : limitNum, 1), 100);

    const offsetNum = Number.parseInt(p.offset ?? '', 10);
    const offset = Math.max(Number.isNaN(offsetNum) ? 0 : offsetNum, 0);

    const sortRaw = p.sort ?? 'semver:desc';
    const sort = (sortRaw in ORDER_BY ? sortRaw : 'semver:desc') as Sort;

    const qVal = p.q ? p.q.trim() : undefined;

    return { limit, offset, sort, q: qVal };
  });
}

function parsePlannedDate(name: string) {
  const match = name.match(/\u2013\s*(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

export default async function Page({ searchParams }: PageProps) {
  const { limit, offset, sort, q } = await parseSearchParams(searchParams);

  const env = serverEnv();
  let releases: Release[] = [];
  let error: string | undefined;

  try {
    const data = await getReleases({ limit, offset, sort, q });
    releases = data.items.map((item) => ({
      id: item.id,
      name: item.name,
      plannedDate: parsePlannedDate(item.name),
      status: item.status as Release['status'],
      type: item.type as Release['type'],
      semver: item.semver,
    }));
  } catch (err) {
    console.error('[shaolin-scrolls] failed to load releases', err);
    if (env.E2E_MODE !== '1') {
      error = 'Failed to load releases';
    }
  }

  return (
    <section className="flex min-h-screen flex-col gap-4">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      {error && (
        <div role="alert" className="rounded border border-red-500 bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <ScrollsTableServer data={releases} />
    </section>
  );
}
