import 'server-only';

import ScrollsPageClient from '@/app/shaolin-scrolls/_components/ScrollsPageClient';
import type { ReleaseRow } from '@/components/scrolls/ReleasesTable';
import { getScrollsPage } from '@/lib/scrolls';

export default async function ScrollsTablePanel({
  limit = 20,
  offset = 0,
  sort = 'semver:desc',
  q,
}: {
  limit?: number;
  offset?: number;
  sort?: 'semver:asc' | 'semver:desc';
  q?: string;
}) {
  const { items } = await getScrollsPage({ limit, offset, sort, q });
  const rows: ReleaseRow[] = items.map((item) => ({
    id: Number(item.id),
    label: item.label,
    status: item.status,
    type: item.type,
    releaseDate: item.release_date,
  }));
  return <ScrollsPageClient rows={rows} />;
}

