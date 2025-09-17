'use client';

import { useRef } from 'react';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';
import { formatReleaseDate } from '@/app/(scrolls)/components/formatReleaseDate';
import ScrollDialog from '@/app/(components)/shaolin/ScrollDialog';
import { useScrollDialog } from '@/app/(components)/shaolin/useScrollDialog';
import type { ReleaseRow } from './ReleasesTable';
import { Card } from '@ui';

export default function ReleaseCards({ rows }: { rows: ReleaseRow[] }) {
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
      <ul className="space-y-3" data-testid="release-cards">
        {rows.map((r) => (
          <Card
            as="li"
            key={r.id}
            data-testid="release-card"
            className="p-3"
          >
            <div className="flex items-center justify-between">
              <a
                href={`/shaolin-scrolls/${r.id}`}
                onClick={onIdClick(r.id)}
                aria-label={`Open release ${r.id} details`}
                className="font-semibold link-blue"
                role="button"
                aria-haspopup="dialog"
              >
                #{r.id}
              </a>
              <span className="text-xs opacity-80">
                {formatReleaseDate(r.releaseDate)}
              </span>
            </div>
            <div className="mt-1">{r.label}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge className={getBadgeClass(r.status as any)}>{r.status}</Badge>
              <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
            </div>
          </Card>
        ))}
      </ul>
      <ScrollDialog open={open} onOpenChange={handleOpenChange} id={id} />
    </>
  );
}
