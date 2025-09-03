'use client';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import ReleaseCards from '@/components/scrolls/ReleaseCards';
import ReleasesTable, { type ReleaseRow } from '@/components/scrolls/ReleasesTable';

export default function ScrollsPageClient({ rows }: { rows: ReleaseRow[] }) {
  const isMd = useBreakpoint();
  return isMd ? <ReleasesTable rows={rows} /> : <ReleaseCards rows={rows} />;
}

