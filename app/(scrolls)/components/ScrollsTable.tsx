"use client";

import { ScrollDetailsDialog } from "./ScrollDetailsDialog";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";

export type Row = {
  id: number;
  label: string;
  status: string;
  type: string;
  releaseDate: string | null;
};

export function formatReleaseDate(d: string | null): string {
  return d ? d.slice(0, 10) : "—";
}

export default function ScrollsTable({ rows }: { rows: Row[] }) {
  return (
    <div id="scrolls-table" className="w-full">
      {/* Desktop table */}
      <div className="block overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <table
          aria-label="Releases table"
          data-testid="releases-table"
          className="min-w-full text-sm table-auto"
        >
          <thead className="bg-[#00471B] text-[#EEE1C6]">
            <tr>
              <th scope="col" data-testid="col-id" className="text-left px-4 py-3">ID</th>
              <th scope="col" data-testid="col-release-name" className="text-left px-4 py-3">Release Name</th>
              <th scope="col" data-testid="col-status" className="text-left px-4 py-3">Status</th>
              <th scope="col" data-testid="col-type" className="text-left px-4 py-3">Type</th>
              <th scope="col" data-testid="col-release-date" className="text-left px-4 py-3">Release Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={idx % 2 === 0 ? "bg-white" : "bg-[#EEE1C6]"}
              >
                <td className="px-4 py-3 align-middle">
                  <ScrollDetailsDialog
                    id={r.id}
                    trigger={
                      <button className="underline decoration-[var(--bucks-green)] text-[var(--bucks-green)]">
                        {r.id}
                      </button>
                    }
                  />
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="block truncate" title={r.label}>
                    {r.label}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <Badge className={getBadgeClass(r.status as any)}>
                    {r.status}
                  </Badge>
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

      {/* Mobile cards */}
      <ul className="md:hidden space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border bucks-border p-3 bucks-surface"
          >
            <div className="flex items-center justify-between">
              <ScrollDetailsDialog
                id={r.id}
                trigger={
                  <button className="font-semibold underline decoration-[var(--bucks-green)]">
                    #{r.id}
                  </button>
                }
              />
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
    </div>
  );
}
