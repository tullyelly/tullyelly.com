import { Suspense } from 'react';
import ActionBar from './_components/ActionBar';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string; offset?: string; sort?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const parsed = await searchParams.then((p = {}) => ({
    q: p.q?.trim() || '',
    offset: Number.isFinite(Number(p.offset)) ? Math.max(0, Number(p.offset)) : 0,
    sort: p.sort === 'semver:asc' ? 'semver:asc' : 'semver:desc' as 'semver:asc' | 'semver:desc',
  }));
  const { q, offset, sort } = parsed;
  return (
    <section id="scrolls-root" className="flex min-h-screen flex-col gap-4">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      {/* Server-stable ActionBar with server forms */}
      <ActionBar q={q} />
      <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
        <ScrollsTablePanel basePath="/shaolin-scrolls" q={q || undefined} offset={offset} sort={sort} />
      </Suspense>
    </section>
  );
}
