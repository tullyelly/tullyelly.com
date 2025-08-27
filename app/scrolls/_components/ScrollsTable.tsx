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
  const [scrolled, setScrolled] = useState(false);

  const columns = useMemo<ColumnDef<Release>[]>(
    () => [
      {
        id: 'expander',
        size: 40,
        minSize: 40,
        enableSorting: false,
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
            className="mx-auto block rounded border px-1 py-0.5"
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          >
            {row.getIsExpanded() ? '▾' : '▸'}
          </button>
        ),
        meta: { headerClassName: 'w-10 text-center', cellClassName: 'w-10 text-center shrink-0' },
      },
      {
        accessorKey: 'name',
        header: 'Release Name',
        size: 600,
        minSize: 280,
        cell: ({ getValue }) => (
          <span className="block truncate" title={getValue<string>()}>
            {getValue<string>()}
          </span>
        ),
        meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        minSize: 120,
        cell: ({ getValue }) => {
          const v = getValue<Release['status']>();
          return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[v]}`}>
              {v}
            </span>
          );
        },
        meta: { headerClassName: 'text-left', cellClassName: 'text-left shrink-0 w-30' },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 100,
        minSize: 100,
        cell: ({ getValue }) => {
          const v = getValue<Release['type']>();
          return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${TYPE_STYLES[v]}`}>
              {v}
            </span>
          );
        },
        meta: { headerClassName: 'text-left', cellClassName: 'text-left shrink-0 w-24' },
      },
      {
        accessorKey: 'semver',
        header: 'SemVer',
        size: 96,
        minSize: 96,
        cell: ({ getValue }) => <code className="font-mono tabular-nums">{getValue<string>()}</code>,
        meta: { headerClassName: 'text-left', cellClassName: 'text-left shrink-0 w-24' },
        sortingFn: 'alphanumeric',
      },
      {
        id: 'actions',
        size: 48,
        minSize: 48,
        enableSorting: false,
        header: () => null,
        cell: () => (
          <details className="relative">
            <summary className="mx-auto block cursor-pointer px-2" aria-label="Row actions">
              ⋮
            </summary>
            <ul className="absolute right-0 z-10 mt-1 rounded border bg-white p-1 text-sm shadow">
              <li>
                <button type="button" onClick={() => {}} className="block w-full px-2 py-1 text-left">
                  Placeholder action
                </button>
              </li>
            </ul>
          </details>
        ),
        meta: { headerClassName: 'w-12 text-center', cellClassName: 'w-12 text-center shrink-0' },
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
    enableColumnResizing: false,
    columnResizeMode: 'onChange',
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
      <div className="hidden md:block">
        <div
          className="overflow-auto rounded border"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          <table className="table-fixed w-full border-separate border-spacing-0 text-sm">
            <thead className={`sticky top-0 bg-white ${scrolled ? 'shadow-sm' : ''}`}>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`px-3 py-2 align-middle whitespace-nowrap font-semibold text-xs uppercase tracking-wide ${(header.column.columnDef.meta as { headerClassName?: string })?.headerClassName ?? ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1"
                              aria-sort={
                                header.column.getIsSorted() === 'asc'
                                  ? 'ascending'
                                  : header.column.getIsSorted() === 'desc'
                                  ? 'descending'
                                  : 'none'
                              }
                              aria-label={`Sort by ${String(header.column.id)}`}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span className="text-neutral-400">
                                {header.column.getIsSorted()
                                  ? header.column.getIsSorted() === 'asc'
                                    ? '▲'
                                    : '▼'
                                  : ''}
                              </span>
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="odd:bg-neutral-50 hover:bg-neutral-100">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={`px-3 py-2 align-middle whitespace-nowrap ${(cell.column.columnDef.meta as { cellClassName?: string })?.cellClassName ?? ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr>
                        <td
                          colSpan={table.getVisibleLeafColumns().length}
                          className="bg-neutral-50 p-2"
                        />
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="p-4 text-center text-sm"
                  >
                    No releases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="mb-2 rounded border p-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={row.getToggleExpandedHandler()}
                  aria-expanded={row.getIsExpanded()}
                  aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                  className="mr-2 rounded border px-1 py-0.5"
                >
                  {row.getIsExpanded() ? '▾' : '▸'}
                </button>
                <span className="flex-1 truncate font-semibold" title={row.original.name}>
                  {row.original.name}
                </span>
                <details className="relative">
                  <summary className="cursor-pointer px-2" aria-label="Row actions">
                    ⋮
                  </summary>
                  <ul className="absolute right-0 z-10 mt-1 rounded border bg-white p-1 text-sm shadow">
                    <li>
                      <button type="button" onClick={() => {}} className="block w-full px-2 py-1 text-left">
                        Placeholder action
                      </button>
                    </li>
                  </ul>
                </details>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[row.original.status]}`}>
                  {row.original.status}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${TYPE_STYLES[row.original.type]}`}>
                  {row.original.type}
                </span>
                <span className="font-mono tabular-nums">{row.original.semver}</span>
              </div>
              {row.getIsExpanded() && (
                <div className="mt-2 bg-neutral-50 p-2 text-sm" />
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

