'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  type RowData,
} from '@tanstack/react-table';

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
  status: 'planned' | 'released' | 'archived';
  type: 'patch' | 'minor' | 'hotfix';
  semver: string;
};

const STATUS_STYLES: Record<Release['status'], string> = {
  planned: 'bg-[#0077C0] text-white',
  released: 'bg-[#008000] text-white',
  archived: 'bg-[#EEE1C6] text-black',
};

const TYPE_STYLES: Record<Release['type'], string> = {
  patch: 'bg-[#F0EBD2] text-black',
  minor: 'bg-[#008000] text-white',
  hotfix: 'bg-[#C41E3A] text-white',
};

const columns: ColumnDef<Release, any>[] = [
  {
    id: 'expander',
    size: 40,
    minSize: 40,
    header: () => null,
    cell: ({ row }) => (
      <button
        aria-expanded={row.getIsExpanded()}
        onClick={row.getToggleExpandedHandler()}
        className="mx-auto block"
      >
        {row.getIsExpanded() ? '▾' : '▸'}
      </button>
    ),
    meta: { headerClassName: 'w-10 text-center', cellClassName: 'w-10 text-center shrink-0' },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Release Name',
    size: 600,
    minSize: 280,
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
    minSize: 120,
    cell: info => {
      const v = info.getValue<Release['status']>();
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[v]}`}>
          {v}
        </span>
      );
    },
    meta: { headerClassName: 'text-left', cellClassName: 'text-left w-30 shrink-0' },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 100,
    minSize: 100,
    cell: info => {
      const v = info.getValue<Release['type']>();
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[v]}`}>
          {v}
        </span>
      );
    },
    meta: { headerClassName: 'text-left', cellClassName: 'text-left w-24 shrink-0' },
  },
  {
    accessorKey: 'semver',
    header: 'SemVer',
    size: 96,
    minSize: 96,
    cell: info => <code className="font-mono tabular-nums">{info.getValue<string>()}</code>,
    meta: { headerClassName: 'text-left', cellClassName: 'text-left w-24 shrink-0' },
    sortingFn: 'alphanumeric',
  },
  {
    id: 'actions',
    size: 48,
    minSize: 48,
    header: () => null,
    cell: () => <button className="mx-auto block" aria-label="Row actions">⋯</button>,
    enableSorting: false,
    meta: { headerClassName: 'w-12 text-center', cellClassName: 'w-12 text-center shrink-0' },
  },
];

export function ScrollsTable({ data, pageSize = 20 }: { data: Release[]; pageSize?: number }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, expanded },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    initialState: { pagination: { pageSize } },
    columnResizeMode: 'onChange',
  });

  return (
    <div>
      <input
        value={globalFilter ?? ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search releases"
        className="mb-2 w-full rounded border px-2 py-1"
      />
      <div className="rounded-xl border overflow-auto">
        <table className="table-fixed w-full border-separate border-spacing-0">
          <thead className="sticky top-0 bg-white shadow-sm">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    style={{ width: h.getSize() }}
                    className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide align-middle ${h.column.columnDef.meta?.headerClassName ?? ''}`}
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
          <tbody>
            {table.getRowModel().rows.map(r => (
              <tr key={r.id} className="odd:bg-neutral-50 hover:bg-neutral-100">
                {r.getVisibleCells().map(c => (
                  <td
                    key={c.id}
                    style={{ width: c.column.getSize() }}
                    className={`px-3 py-2 align-middle whitespace-nowrap ${c.column.columnDef.meta?.cellClassName ?? ''}`}
                  >
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
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

