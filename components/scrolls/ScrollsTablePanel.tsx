import 'server-only';

import { ScrollsTable, type ScrollRow } from './ScrollsTable';
import { getScrolls } from '@/lib/scrolls';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';

function parsePlannedDate(name: string) {
  const match = name.match(/\u2013\s*(\d{4}-\d{2})/);
  return match ? match[1] : '';
}

function mapToRows(items: Awaited<ReturnType<typeof getScrolls>>): ScrollRow[] {
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
  limit = 20,
  q,
  dense = false,
  showStatus = true,
}: {
  limit?: number;
  q?: string;
  dense?: boolean;
  showStatus?: boolean;
}) {
  const items = await getScrolls({ limit, q });
  const rows = mapToRows(items);

  return (
    <ScrollsTable
      rows={rows}
      dense={dense}
      showStatus={showStatus}
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
