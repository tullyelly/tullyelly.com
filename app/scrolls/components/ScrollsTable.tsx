'use client';

import { Fragment, useState } from 'react';
import ReleaseRowDetail from '@/components/ReleaseRowDetail';
import type { ReleaseRow } from '@/types/releases';

interface ScrollsTableProps {
  rows: ReleaseRow[];
}

export default function ScrollsTable({ rows }: ScrollsTableProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  return (
    <div className="overflow-auto">
      <table className="min-w-full table-auto w-full">
        <thead className="sticky top-0 z-20 bg-surface-card">
          <tr>
            <th className="sticky left-0 z-30 bg-surface-card p-2 text-left">Release Name</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">SemVer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.id}>
              <tr className="hover:bg-surface">
                <td className="sticky left-0 z-10 bg-surface-card p-2">
                  <div className="flex items-center gap-2 min-w-[12rem]">
                    <button
                      type="button"
                      aria-label={expanded[row.id] ? 'Collapse row' : 'Expand row'}
                      onClick={() => setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      className="rounded border px-2 py-1"
                    >
                      {expanded[row.id] ? '-' : '+'}
                    </button>
                    <span>{row.name}</span>
                  </div>
                </td>
                <td className="p-2 min-w-[8rem]">{row.status}</td>
                <td className="p-2 min-w-[8rem]">{row.type}</td>
                <td className="p-2 min-w-[8rem]">{row.semver}</td>
              </tr>
              {expanded[row.id] && (
                <tr>
                  <td colSpan={4} className="bg-surface p-2">
                    <ReleaseRowDetail id={row.id} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

