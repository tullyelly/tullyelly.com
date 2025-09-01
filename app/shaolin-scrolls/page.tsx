import { Suspense } from 'react';
import ActionBar from './_components/ActionBar';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams.then((p = {}) => ({ q: p.q?.trim() || '' }));
  return (
    <section id="scrolls-root" className="flex min-h-screen flex-col gap-4">
      <h1 className="text-xl font-semibold">Shaolin Scrolls</h1>
      {/* Server-stable ActionBar with server forms */}
      <ActionBar q={q} />
      <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
        <ScrollsTablePanel q={q || undefined} />
      </Suspense>
    </section>
  );
}
