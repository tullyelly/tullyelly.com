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
  const response = await getScrollsPage({ limit, offset, sort, q });
  const { items, page } = response;
  const rows: ReleaseRow[] = items.map((item) => ({
    id: Number(item.id),
    label: item.label,
    status: item.status,
    type: item.type,
    releaseDate: item.release_date,
  }));
  const total = page.total;
  const pageSize = page.limit;
  const currentPage = total > 0 ? Math.floor(page.offset / pageSize) + 1 : 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  return (
    <ScrollsPageClient
      rows={rows}
      meta={{ page: currentPage, pageSize, total, totalPages, q: q ?? '', sort }}
    />
  );
}
