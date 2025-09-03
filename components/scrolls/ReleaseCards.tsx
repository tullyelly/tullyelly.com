'use client';

import Link from 'next/link';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';
import { formatReleaseDate } from '@/app/(scrolls)/components/formatReleaseDate';
import type { ReleaseRow } from './ReleasesTable';

export default function ReleaseCards({ rows }: { rows: ReleaseRow[] }) {
  return (
    <ul className="space-y-3" data-testid="release-cards">
      {rows.map((r) => (
        <li
          key={r.id}
          data-testid="release-card"
          className="rounded-xl border bucks-border p-3 bucks-surface"
        >
          <div className="flex items-center justify-between">
            <Link
              href={`/shaolin-scrolls/${r.id}`}
              aria-label={`Open release ${r.id} details`}
              className="font-semibold underline decoration-[var(--bucks-green)]"
            >
              #{r.id}
            </Link>
            <span className="text-xs opacity-80">
              {formatReleaseDate(r.releaseDate)}
            </span>
          </div>
          <div className="mt-1">{r.label}</div>
          <div className="mt-2 flex gap-2 text-xs">
            <Badge className={getBadgeClass(r.status as any)}>{r.status}</Badge>
            <Badge className={getBadgeClass(r.type as any)}>{r.type}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

