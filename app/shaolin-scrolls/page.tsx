import { readSearchParams } from '@/lib/server/search-params';
import { logger } from '@/app/lib/server-logger';
import type { ReleaseListResponse } from '@/types/releases';
import type { Release } from './_components/ScrollsTable';
import ScrollsPageClient from './_components/ScrollsPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string; sort?: string; q?: string }>;
}

function parsePlannedDate(name: string) {
  const match = name.match(/\u2013\s*(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

export default async function Page({ searchParams }: PageProps) {
  const { limit, offset, sort, q } = await readSearchParams(searchParams);

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
    logger.error('[shaolin-scrolls] failed to load releases', err);
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
    <section className="flex h-[calc(100vh-160px)] flex-col gap-4">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      {error && (
        <div role="alert" className="rounded border border-red-500 bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ScrollsPageClient data={releases} />
      </div>
    </section>
  );
}

