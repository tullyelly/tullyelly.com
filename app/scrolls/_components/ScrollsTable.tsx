'use client';

import React, { useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';

export type Release = {
  id: string;
  name: string;
  plannedDate: string;
  status: 'planned' | 'released' | 'archived';
  type: 'patch' | 'minor' | 'hotfix';
  semver: string;
};

export type ScrollsTableProps = {
  data: Release[];
  pageSize?: number;
  error?: string;
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

export default function ScrollsTable({ data, pageSize = 20, error }: ScrollsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const columns = useMemo<ColumnDef<Release>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
            className="rounded border px-1 py-0.5"
          >
            {row.getIsExpanded() ? '▾' : '▸'}
          </button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="flex items-center gap-1"
            aria-label="Sort by release name"
          >
            Release Name
            {column.getIsSorted() === 'asc' && '▲'}
            {column.getIsSorted() === 'desc' && '▼'}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="flex items-center gap-1"
            aria-label="Sort by status"
          >
            Status
            {column.getIsSorted() === 'asc' && '▲'}
            {column.getIsSorted() === 'desc' && '▼'}
          </button>
        ),
        cell: ({ getValue }) => {
          const v = getValue<Release['status']>();
          return <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[v]}`}>{v}</span>;
        },
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="flex items-center gap-1"
            aria-label="Sort by type"
          >
            Type
            {column.getIsSorted() === 'asc' && '▲'}
            {column.getIsSorted() === 'desc' && '▼'}
          </button>
        ),
        cell: ({ getValue }) => {
          const v = getValue<Release['type']>();
          return <span className={`rounded-full px-2 py-0.5 text-xs ${TYPE_STYLES[v]}`}>{v}</span>;
        },
      },
      {
        accessorKey: 'semver',
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="flex items-center gap-1"
            aria-label="Sort by semver"
          >
            SemVer
            {column.getIsSorted() === 'asc' && '▲'}
            {column.getIsSorted() === 'desc' && '▼'}
          </button>
        ),
        cell: ({ getValue }) => <span className="font-mono">{getValue<string>()}</span>,
      },
      {
        id: 'actions',
        header: () => null,
        cell: () => (
          <details className="relative">
            <summary className="cursor-pointer px-2" aria-label="Row actions">
              ⋮
            </summary>
            <ul className="absolute right-0 z-10 mt-1 rounded border bg-white p-1 text-sm shadow">
              <li>
                <button
                  type="button"
                  onClick={() => {}}
                  className="block w-full px-2 py-1 text-left"
                >
                  Placeholder action
                </button>
              </li>
            </ul>
          </details>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-2 rounded border border-red-500 bg-red-50 p-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <input
        value={globalFilter ?? ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search releases"
        className="mb-2 w-full rounded border px-2 py-1"
      />
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="sticky top-0 z-10 bg-white p-2 text-left shadow-sm"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-surface even:bg-surface/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && (
                    <tr>
                      <td colSpan={table.getVisibleLeafColumns().length} className="bg-surface p-2">
                        {/* details placeholder */}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="p-4 text-center text-sm">
                  No releases found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="mb-2 rounded border p-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={row.getToggleExpandedHandler()}
                  aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                  className="mr-2 rounded border px-1 py-0.5"
                >
                  {row.getIsExpanded() ? '▾' : '▸'}
                </button>
                <span className="flex-1 truncate font-semibold">{row.original.name}</span>
                <details className="relative">
                  <summary className="cursor-pointer px-2" aria-label="Row actions">
                    ⋮
                  </summary>
                  <ul className="absolute right-0 z-10 mt-1 rounded border bg-white p-1 text-sm shadow">
                    <li>
                      <button
                        type="button"
                        onClick={() => {}}
                        className="block w-full px-2 py-1 text-left"
                      >
                        Placeholder action
                      </button>
                    </li>
                  </ul>
                </details>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[row.original.status]}`}>
                  {row.original.status}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${TYPE_STYLES[row.original.type]}`}>
                  {row.original.type}
                </span>
                <span className="font-mono">{row.original.semver}</span>
              </div>
              {row.getIsExpanded() && (
                <div className="mt-2 bg-surface p-2 text-sm">
                  {/* details placeholder */}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-sm">No releases found</p>
        )}
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
            {[10, 20, 50].map((size) => (
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

