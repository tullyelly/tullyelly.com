'use client';

import { useRef } from 'react';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';
import { formatReleaseDate } from '@/app/(scrolls)/components/formatReleaseDate';
import ScrollDialog from '@/app/(components)/shaolin/ScrollDialog';
import { useScrollDialog } from '@/app/(components)/shaolin/useScrollDialog';
import { Table, THead, TBody } from '@/components/ui/Table';

export interface ReleaseRow {
  id: number;
  label: string;
  status: string;
  type: string;
  releaseDate: string | null;
}

export default function ReleasesTable({ rows }: { rows: ReleaseRow[] }) {
  const { open, setOpen, id, openWithId } = useScrollDialog();
  const triggerRef = useRef<HTMLAnchorElement | null>(null);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) triggerRef.current?.focus();
  };

  const onIdClick = (id: number) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.button === 1) {
        return;
      }
      e.preventDefault();
      triggerRef.current = e.currentTarget;
      openWithId(id);
    };

  return (
    <>
      <Table
        variant="bucks"
        id="scrolls-table"
        aria-label="Releases table"
        data-testid="releases-table"
        aria-rowcount={rows.length}
        className="thead-sticky"
      >
        <THead variant="bucks">
          <th scope="col" className="w-[72px]">
            ID
          </th>
          <th scope="col">Release Name</th>
          <th scope="col" className="w-[140px]">
            Status
          </th>
          <th scope="col" className="w-[120px]">
            Type
          </th>
          <th scope="col" className="w-[220px]">
            Release Date
          </th>
        </THead>
        <TBody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-black/5 last:border-0">
              <td className="tabular-nums text-ink/80">
                <a
                  href={`/shaolin-scrolls/${r.id}`}
                  onClick={onIdClick(r.id)}
                  aria-label={`Open release ${r.id} details`}
                  className="link-blue"
                  role="button"
                  aria-haspopup="dialog"
                >
                  {r.id}
                </a>
              </td>
              <td className="truncate">
                <span className="block" title={r.label}>
                  {r.label}
                </span>
              </td>
              <td>
                <Badge className={getBadgeClass(r.status as any)}>{r.status}</Badge>
              </td>
              <td>
                <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
              </td>
              <td className="whitespace-nowrap">
                {formatReleaseDate(r.releaseDate)}
              </td>
            </tr>
          ))}
        </TBody>
      </Table>
      <ScrollDialog open={open} onOpenChange={handleOpenChange} id={id} />
    </>
  );
}
