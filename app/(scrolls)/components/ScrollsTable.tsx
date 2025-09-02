'use client';

import { ScrollDetailsDialog } from './ScrollDetailsDialog';

export type Row = {
  id: number;
  label: string;
  status: string;
  type: string;
  releaseDate: string | null;
};

export function formatReleaseDate(d: string | null): string {
  return d ? d.slice(0, 10) : '—';
}

export default function ScrollsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="w-full">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Release Name</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Release Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">
                  <ScrollDetailsDialog
                    id={r.id}
                    trigger={
                      <button className="underline decoration-[var(--bucks-green)] text-[var(--bucks-green)]">
                        {r.id}
                      </button>
                    }
                  />
                </td>
                <td className="p-2">{r.label}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{formatReleaseDate(r.releaseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bucks-border p-3 bucks-surface">
            <div className="flex items-center justify-between">
              <ScrollDetailsDialog
                id={r.id}
                trigger={
                  <button className="font-semibold underline decoration-[var(--bucks-green)]">
                    #{r.id}
                  </button>
                }
              />
              <span className="text-xs opacity-80">{formatReleaseDate(r.releaseDate)}</span>
            </div>
            <div className="mt-1">{r.label}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full border bucks-border">{r.status}</span>
              <span className="px-2 py-0.5 rounded-full border bucks-border">{r.type}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
