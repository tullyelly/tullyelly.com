'use client';

import Link from 'next/link';
import { Badge } from '@/app/ui/Badge';
import { getBadgeClass } from '@/app/ui/badge-maps';
import { formatReleaseDate } from '@/app/(scrolls)/components/formatReleaseDate';

export interface ReleaseRow {
  id: number;
  label: string;
  status: string;
  type: string;
  releaseDate: string | null;
}

export default function ReleasesTable({ rows }: { rows: ReleaseRow[] }) {
  return (
    <div className="w-full" data-testid="releases-table-wrapper">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <table
          id="scrolls-table"
          aria-label="Releases table"
          data-testid="releases-table"
          className="min-w-full table-auto text-sm"
        >
          <thead className="bg-[#00471B] text-[#EEE1C6]">
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
              <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#EEE1C6]'}>
                <td className="px-4 py-3 align-middle">
                  <Link
                    href={`/shaolin-scrolls/${r.id}`}
                    aria-label={`Open release ${r.id} details`}
                    className="underline decoration-[var(--bucks-green)] text-[var(--bucks-green)]"
                  >
                    {r.id}
                  </Link>
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
      </div>
    </div>
  );
}

