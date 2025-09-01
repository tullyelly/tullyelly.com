import 'server-only';

import { ScrollsTable, type ScrollRow } from './ScrollsTable';
import { getScrollsPage } from '@/lib/scrolls';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';

function parsePlannedDate(name: string) {
  const match = name.match(/\u2013\s*(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

function mapToRows(items: Array<{ id: string; name: string; status: string; type: string; semver: string }>): ScrollRow[] {
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    plannedDate: parsePlannedDate(item.name),
    status: item.status,
    type: item.type,
    semver: item.semver,
  }));
}

export default async function ScrollsTablePanel({
  basePath,
  limit = 20,
  offset = 0,
  sort = 'semver:desc',
  q,
  dense = false,
  showStatus = true,
}: {
  basePath: string;
  limit?: number;
  offset?: number;
  sort?: 'semver:asc' | 'semver:desc';
  q?: string;
  dense?: boolean;
  showStatus?: boolean;
}) {
  const { items, page } = await getScrollsPage({ limit, offset, sort, q });
  const rows = mapToRows(items);

  const makeHref = (p: { offset?: number; sort?: 'semver:asc' | 'semver:desc'; q?: string }) => {
    const sp = new URLSearchParams();
    sp.set('offset', String(p.offset ?? page.offset));
    sp.set('sort', p.sort ?? page.sort);
    if (p.q ?? page.q) sp.set('q', (p.q ?? page.q) as string);
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <ScrollsTable
      rows={rows}
      dense={dense}
      showStatus={showStatus}
      pageSize={page.limit}
      pageIndex={Math.floor(page.offset / page.limit)}
      total={page.total}
      buildPageHref={(index) => makeHref({ offset: index * page.limit })}
      renderStatus={(status) => {
        const v = (status ?? '').toLowerCase().trim() as any;
        const cls = getBadgeClass(v);
        return <Badge className={cls}>{v || 'unknown'}</Badge>;
      }}
      renderType={(type) => {
        const v = (type ?? '').toLowerCase().trim() as any;
        const cls = getBadgeClass(v);
        return <Badge className={cls}>{v || 'unknown'}</Badge>;
      }}
    />
  );
}
