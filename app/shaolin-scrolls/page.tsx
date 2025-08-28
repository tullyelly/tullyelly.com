import type { ReleaseListResponse } from '@/app/api/releases/route';
import type { Release } from './_components/ScrollsTable';
import ScrollsPageClient from './_components/ScrollsPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string; sort?: string; q?: string }>;
}

function parseSearchParams(params: PageProps['searchParams']) {
  return params.then((p = {}) => {
    const limitNum = Number.parseInt(p.limit ?? '', 10);
    const limit = Math.min(Math.max(Number.isNaN(limitNum) ? 20 : limitNum, 1), 100);

    const offsetNum = Number.parseInt(p.offset ?? '', 10);
    const offset = Math.max(Number.isNaN(offsetNum) ? 0 : offsetNum, 0);

    const sort = p.sort ?? 'semver:desc';
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

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), sort });
  if (q) params.set('q', q);

  let data: ReleaseListResponse = {
    items: [],
    page: { limit, offset, total: 0, sort, ...(q ? { q } : {}) },
  };
  let error: string | undefined;

  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${base}/api/releases?${params.toString()}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (res.ok) data = await res.json();
    else error = 'Failed to load releases';
  } catch (err) {
    console.error('[shaolin-scrolls] failed to load releases', err);
    error = 'Failed to load releases';
  }

  const releases: Release[] = data.items.map((item) => ({
    id: item.id,
    name: item.name,
    plannedDate: parsePlannedDate(item.name),
    status: item.status as Release['status'],
    type: item.type as Release['type'],
    semver: item.semver,
  }));

  return (
    <section className="flex flex-col gap-4 min-h-screen">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      {error && (
        <div role="alert" className="rounded border border-red-500 bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <ScrollsPageClient data={releases} />
    </section>
  );
}

