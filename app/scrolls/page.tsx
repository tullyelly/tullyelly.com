import { logger } from '@/app/lib/server-logger';
import type { ReleaseListResponse } from '@/types/releases';
import ScrollsLayout from './components/ScrollsLayout';
import ScrollsSidebar from './components/ScrollsSidebar';
import ScrollsTable from './components/ScrollsTable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: { limit?: string; offset?: string; sort?: string; q?: string };
}

export default async function Page({ searchParams }: PageProps) {
  const limit = Math.min(Math.max(parseInt(searchParams?.limit ?? '20', 10), 1), 100);
  const offset = Math.max(parseInt(searchParams?.offset ?? '0', 10), 0);
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : 'semver:desc';
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;

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

