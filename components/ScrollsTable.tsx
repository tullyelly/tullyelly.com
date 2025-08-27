'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState, type Row
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRouter, useSearchParams } from 'next/navigation';
import ReleaseRowDetail from './ReleaseRowDetail';
import type { ReleaseListItem, PageMeta } from '@/types/releases';
import styles from './ScrollsTable.module.css';

export interface ScrollsTableProps {
  rows: ReleaseListItem[];
  total: number;
  page: PageMeta;
}

const PAGE_SIZES = [20, 50, 100] as const;
const STATUS_OPTIONS = ['planned', 'released', 'archived'] as const;
const TYPE_OPTIONS = ['planned', 'hotfix', 'minor', 'major'] as const;
const TYPE_COLORS: Record<string, string> = {
  hotfix: '#C41E3A',
  minor: '#008000',
  major: '#F0EBD2',
  planned: '#0077C0',
  archived: '#EEE1C6',
};

export default function ScrollsTable({ rows, total, page }: ScrollsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [sorting, setSorting] = useState<SortingState>(() => {
    const [id, dir] = page.sort.split(':');
    return [{ id, desc: dir === 'desc' }];
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState(page.q ?? '');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string[]>(page.status ?? []);
  const [typeFilter, setTypeFilter] = useState<string[]>(page.type ?? []);

  useEffect(() => {
    const [id, dir] = page.sort.split(':');
    setSorting([{ id, desc: dir === 'desc' }]);
  }, [page.sort]);
  useEffect(() => {
    setGlobalFilter(page.q ?? '');
  }, [page.q]);
  useEffect(() => {
    setStatusFilter(page.status ?? []);
  }, [page.status]);
  useEffect(() => {
    setTypeFilter(page.type ?? []);
  }, [page.type]);
  useEffect(() => {
    setExpanded({});
  }, [rows]);

  const columns = useMemo<ColumnDef<ReleaseListItem>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
            onClick={row.getToggleExpandedHandler()}
            className={styles.focusRing}
          >
            {row.getIsExpanded() ? '-' : '+'}
          </button>
        ),
      },
      {
        accessorKey: 'release_name',
        header: 'Release Name',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className="block max-w-[16rem] truncate" title={v}>
              {v}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'release_type',
        header: 'Type',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          const bg = TYPE_COLORS[v] ?? '#ddd';
          const color = v === 'major' || v === 'archived' ? '#000' : '#fff';
          return (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: bg, color }}
            >
              {v}
            </span>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          const d = new Date(v);
          const dateStr = d.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });
          const timeStr = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          return (
            <time dateTime={v} title={v}>{`${dateStr} – ${timeStr}`}</time>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <details className="relative">
            <summary
              className={`${styles.focusRing} cursor-pointer px-2`}
              aria-label="Row actions"
            >
              ⋮
            </summary>
            <ul className="absolute right-0 z-10 mt-1 rounded border bg-white p-1 shadow">
              <li>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(row.original.release_name)}
                  className="block w-full px-2 py-1 text-left"
                >
                  Copy release name
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.open(`/api/releases/${row.original.id}`, '_blank')}
                  className="block w-full px-2 py-1 text-left"
                >
                  View details
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => alert('Archive not implemented')}
                  className="block w-full px-2 py-1 text-left"
                >
                  Archive
                </button>
              </li>
            </ul>
          </details>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility, expanded },
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      const sort = next[0];
      updateParams({
        limit: String(page.limit),
        offset: '0',
        sort: sort ? `${sort.id}:${sort.desc ? 'desc' : 'asc'}` : 'created_at:desc',
        q: page.q,
        status: statusFilter,
        type: typeFilter,
      });
    },
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => true,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const baseRows = table.getRowModel().rows;
  const expandedState = table.getState().expanded;
  const flatRows = useMemo(() => {
    const out: Array<{ row: Row<ReleaseListItem>; type: 'data' | 'detail' }> = [];
    for (const row of baseRows) {
      out.push({ row, type: 'data' });
      if (expandedState[row.id]) out.push({ row, type: 'detail' });
    }
    return out;
  }, [baseRows, expandedState]);
  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      const params = new URLSearchParams(search);
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, search]
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (globalFilter === (page.q ?? '')) return;
      updateParams({
        q: globalFilter || undefined,
        offset: '0',
        limit: String(page.limit),
        sort: page.sort,
        status: statusFilter,
        type: typeFilter,
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [globalFilter, page.limit, page.q, page.sort, statusFilter, typeFilter, updateParams]);

  const totalPages = Math.max(Math.ceil(total / page.limit), 1);
  const currentPage = Math.floor(page.offset / page.limit) + 1;
  const start = page.offset + 1;
  const end = Math.min(page.offset + rows.length, total);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className={styles.focusRing}
        />
        <details className="relative">
          <summary className={`${styles.focusRing} cursor-pointer px-2`}>Status</summary>
          <div className="absolute z-10 mt-1 rounded border bg-white p-2">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(opt)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const next = checked
                      ? [...statusFilter, opt]
                      : statusFilter.filter((s) => s !== opt);
                    setStatusFilter(next);
                    updateParams({
                      status: next,
                      type: typeFilter,
                      q: globalFilter || undefined,
                      offset: '0',
                      limit: String(page.limit),
                      sort: page.sort,
                    });
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        </details>
        <details className="relative">
          <summary className={`${styles.focusRing} cursor-pointer px-2`}>Type</summary>
          <div className="absolute z-10 mt-1 rounded border bg-white p-2">
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={typeFilter.includes(opt)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const next = checked
                      ? [...typeFilter, opt]
                      : typeFilter.filter((s) => s !== opt);
                    setTypeFilter(next);
                    updateParams({
                      status: statusFilter,
                      type: next,
                      q: globalFilter || undefined,
                      offset: '0',
                      limit: String(page.limit),
                      sort: page.sort,
                    });
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        </details>
        <div className="ml-auto flex items-center gap-1">
          <span>Page size</span>
          <select
            value={page.limit}
            onChange={(e) =>
              updateParams({
                limit: e.target.value,
                offset: '0',
                sort: page.sort,
                q: page.q,
                status: statusFilter,
                type: typeFilter,
              })
            }
            className={styles.focusRing}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {table
          .getAllLeafColumns()
          .filter((c) => !['expander', 'actions'].includes(c.id))
          .map((col) => (
            <label key={col.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
              />
              {col.columnDef.header as string}
            </label>
          ))}
      </div>

      <div ref={parentRef} className={styles.tableContainer}>
        <table className={`${styles.table} ${styles.compact}`}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const ariaSort = header.column.getIsSorted()
                    ? header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none';
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={styles.focusRing}
                      tabIndex={sortable ? 0 : undefined}
                      aria-sort={ariaSort}
                      onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                      onKeyDown={
                        sortable
                          ? (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                header.column.toggleSorting();
                              }
                            }
                          : undefined
                      }
                      scope="col"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody style={{ position: 'relative', height: `${totalSize}px` }}>
            {virtualItems.map((virtualRow) => {
              const item = flatRows[virtualRow.index];
              if (item.type === 'data') {
                const row = item.row;
                return (
                  <tr
                    key={row.id}
                    ref={rowVirtualizer.measureElement}
                    className={styles.row}
                    style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={styles.focusRing}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              }
              const row = item.row;
              return (
                <tr
                  key={`${row.id}-detail`}
                  ref={rowVirtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}
                >
                  <td colSpan={row.getVisibleCells().length}>
                    <ReleaseRowDetail id={row.original.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            updateParams({
              offset: '0',
              limit: String(page.limit),
              sort: page.sort,
              q: page.q,
              status: statusFilter,
              type: typeFilter,
            })
          }
          disabled={!canPrev}
          className={styles.focusRing}
        >
          «
        </button>
        <button
          type="button"
          onClick={() =>
            updateParams({
              offset: String(Math.max(page.offset - page.limit, 0)),
              limit: String(page.limit),
              sort: page.sort,
              q: page.q,
              status: statusFilter,
              type: typeFilter,
            })
          }
          disabled={!canPrev}
          className={styles.focusRing}
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() =>
              updateParams({
                offset: String((p - 1) * page.limit),
                limit: String(page.limit),
                sort: page.sort,
                q: page.q,
                status: statusFilter,
                type: typeFilter,
              })
            }
            disabled={p === currentPage}
            className={styles.focusRing}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            updateParams({
              offset: String(page.offset + page.limit),
              limit: String(page.limit),
              sort: page.sort,
              q: page.q,
              status: statusFilter,
              type: typeFilter,
            })
          }
          disabled={!canNext}
          className={styles.focusRing}
        >
          ›
        </button>
        <button
          type="button"
          onClick={() =>
            updateParams({
              offset: String((totalPages - 1) * page.limit),
              limit: String(page.limit),
              sort: page.sort,
              q: page.q,
              status: statusFilter,
              type: typeFilter,
            })
          }
          disabled={!canNext}
          className={styles.focusRing}
        >
          »
        </button>
        <span className="ml-4">
          showing {start}-{end} of {total}
        </span>
      </div>
    </div>
  );
}
