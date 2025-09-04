'use client';

import ReleaseCards from '@/components/scrolls/ReleaseCards';
import ReleasesTable, { type ReleaseRow } from '@/components/scrolls/ReleasesTable';

export default function ScrollsPageClient({ rows }: { rows: ReleaseRow[] }) {
  return (
    <>
      <div className="md:hidden">
        <ReleaseCards rows={rows} />
      </div>
      <ReleasesTable rows={rows} />
    </>
  );
}

