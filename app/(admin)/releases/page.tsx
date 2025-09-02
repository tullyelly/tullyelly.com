export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import ScrollsTablePanel from '@/components/scrolls/ScrollsTablePanel';
import CreatePatchDialog from '@/components/scrolls/CreatePatchDialog';

export default function ReleasesAdminPage() {
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Releases</h1>
        <CreatePatchDialog />
      </div>
      <Suspense fallback={<div className="rounded border bg-white p-4">Loading releases…</div>}>
        <ScrollsTablePanel limit={20} />
      </Suspense>
    </main>
  );
}
