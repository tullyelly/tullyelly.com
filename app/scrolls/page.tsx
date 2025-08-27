import { readSearchParams } from '@/lib/server/search-params';
import { logger } from '@/app/lib/server-logger';
import type { ReleaseListResponse } from '@/types/releases';
import ScrollsLayout from './components/ScrollsLayout';
import ScrollsSidebar from './components/ScrollsSidebar';
import ScrollsTable from './components/ScrollsTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string; sort?: string; q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { limit, offset, sort, q } = await readSearchParams(searchParams);

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), sort });
  if (q) params.set('q', q);

  let data: ReleaseListResponse = {
    items: [],
    page: { limit, offset, total: 0, sort, ...(q ? { q } : {}) },
  };

  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${base}/api/releases?${params.toString()}`, {
      cache: 'no-store',
    });
    if (res.ok) data = await res.json();
  } catch (err) {
    logger.error('[scrolls] failed to load releases', err);
  }

  return (
    <ScrollsLayout sidebar={<ScrollsSidebar />}>
      <h1 className="mb-4 text-xl font-semibold">Shaolin Scrolls</h1>
      <ScrollsTable rows={data.items} />
    </ScrollsLayout>
  );
}

