'use client';

import { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
} from '@tanstack/react-table';
import { Badge } from '../../ui/Badge';
import { getBadgeClass, type BadgeVariant } from '../../ui/badge-maps';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

export type Release = {
  id: string;
  name: string;
  plannedDate: string;
  status: 'planned' | 'released' | 'archived' | 'hotfix';
  type: 'planned' | 'patch' | 'minor' | 'hotfix' | 'major';
  semver: string;
};

const columns: ColumnDef<Release, any>[] = [
  {
    accessorKey: 'name',
    header: 'Release Name',
    minSize: 320,
    cell: info => (
      <span className="block truncate" title={info.getValue<string>()}>
        {info.getValue<string>()}
      </span>
    ),
    meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: info => {
      const raw = info.getValue<Release['status'] | undefined>()
      const v = (raw ?? '').toLowerCase().trim()
      const cls = getBadgeClass(v as BadgeVariant)
      return <Badge className={cls}>{v || 'unknown'}</Badge>
    },
    meta: { headerClassName: 'text-left w-[120px]', cellClassName: 'text-left w-[120px] shrink-0' },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 100,
    cell: info => {
      const raw = info.getValue<Release['type'] | undefined>()
      const v = (raw ?? '').toLowerCase().trim()
      const cls = getBadgeClass(v as BadgeVariant)
      return <Badge className={cls}>{v || 'unknown'}</Badge>
    },
    meta: { headerClassName: 'text-left w-[100px]', cellClassName: 'text-left w-[100px] shrink-0' },
  },
  {
    accessorKey: 'semver',
    header: 'SemVer',
    size: 96,
    cell: info => <code className="font-mono tabular-nums">{info.getValue<string>()}</code>,
    meta: { headerClassName: 'text-right w-24', cellClassName: 'text-right w-24 shrink-0' },
    sortingFn: 'alphanumeric',
  },
];

export function ScrollsTable({
  data,
  globalFilter,
  pageSize = 20,
  isLoading = false,
}: {
  data: Release[];
  globalFilter: string;
  pageSize?: number;
  isLoading?: boolean;
}) {
  const memoData = useMemo(() => data, [data]);

  const table = useReactTable({
    data: memoData,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    columnResizeMode: 'onChange',
  });

  const columnCount = table.getAllLeafColumns().length;
  const BUILD = process.env.VERCEL_GIT_COMMIT_SHA || 'local';

  return (
    <div id="scrolls-table" data-build={BUILD} className="flex flex-col">
      <div className="mb-2 text-xs text-neutral-500">Build: {BUILD}</div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    style={{ width: h.getSize() }}
                    className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${h.column.columnDef.meta?.headerClassName ?? ''}`}
                  >
                    {h.isPlaceholder ? null : (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={h.column.getToggleSortingHandler()}
                        aria-sort={
                          h.column.getIsSorted() === 'asc'
                            ? 'ascending'
                            : h.column.getIsSorted() === 'desc'
                            ? 'descending'
                            : 'none'
                        }
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span className="text-neutral-400">
                          {h.column.getIsSorted() ? (h.column.getIsSorted() === 'asc' ? '▲' : '▼') : ''}
                        </span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map((col, idx) => (
                    <td key={col.id ?? idx} style={{ width: col.size }} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  {r.getVisibleCells().map(c => (
                    <td
                      key={c.id}
                      style={{ width: c.column.getSize() }}
                      className={`px-4 py-3 text-sm text-gray-800 align-middle whitespace-nowrap ${c.column.columnDef.meta?.cellClassName ?? ''}`}
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="p-4 text-center text-sm">
                  No releases found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border px-2 py-1"
          >
            {[10, 20, 50].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="rounded border px-2 py-1"
            aria-label="First page"
          >
            {'<<'}
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border px-2 py-1"
            aria-label="Previous page"
          >
            {'<'}
          </button>
          <span className="px-2 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border px-2 py-1"
            aria-label="Next page"
          >
            {'>'}
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="rounded border px-2 py-1"
            aria-label="Last page"
          >
            {'>>'}
          </button>
        </div>
      </div>
    </div>
  );
}

