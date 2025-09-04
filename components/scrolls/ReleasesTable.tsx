'use client';

import { useRef } from 'react';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';
import { formatReleaseDate } from '@/app/(scrolls)/components/formatReleaseDate';
import ScrollDialog from '@/app/(components)/shaolin/ScrollDialog';
import { useScrollDialog } from '@/app/(components)/shaolin/useScrollDialog';
import { Card } from '@ui';

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
      <div className="w-full" data-testid="releases-table-wrapper">
        <Card as="div" className="overflow-x-auto p-4 md:p-6">
          <table
            id="scrolls-table"
            aria-label="Releases table"
            data-testid="releases-table"
            className="min-w-full table-auto text-sm"
          >
            <thead className="bg-brand-bucksGreen text-brand-creamCityCream">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">ID</th>
                <th scope="col" className="px-4 py-3 text-left">Release Name</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Type</th>
                <th scope="col" className="px-4 py-3 text-left">Release Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-creamCityCream'}>
                  <td className="px-4 py-3 align-middle">
                    <a
                      href={`/shaolin-scrolls/${r.id}`}
                      onClick={onIdClick(r.id)}
                      aria-label={`Open release ${r.id} details`}
                      className="underline decoration-[var(--bucks-green)] text-[var(--bucks-green)]"
                      role="button"
                      aria-haspopup="dialog"
                    >
                      {r.id}
                    </a>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="block truncate" title={r.label}>
                      {r.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge className={getBadgeClass(r.status as any)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {formatReleaseDate(r.releaseDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <ScrollDialog open={open} onOpenChange={handleOpenChange} id={id} />
      </div>
    </>
  );
}

