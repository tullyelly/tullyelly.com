export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';
import { nowIso, formatDateOnly } from '@/lib/format';

export default function Home() {
  const formatted = formatDateOnly(nowIso());
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <section aria-label="Latest Releases" className="space-y-2">
        <h2 className="text-lg font-medium">Shaolin Scrolls — {formatted}</h2>
        <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
          {/* Example usage: show compact list on homepage */}
          <ScrollsTablePanel limit={20} />
        </Suspense>
      </section>
    </main>
  );
}
