'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRouter, useSearchParams } from 'next/navigation';
import ReleaseRowDetail from './ReleaseRowDetail';
import type { ReleaseRow, PageMeta } from '@/types/releases';
import styles from './ScrollsTable.module.css';

export interface ScrollsTableProps {
  rows: ReleaseRow[];
  total: number;
  page: PageMeta;
}

const PAGE_SIZES = [20, 50, 100] as const;
const STATUS_COLORS: Record<string, string> = {
  planned: '#0077C0',
  released: '#008000',
  archived: '#EEE1C6',
};
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
  const [globalFilter, setGlobalFilter] = useState(page.q ?? '');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const [id, dir] = page.sort.split(':');
    setSorting([{ id, desc: dir === 'desc' }]);
  }, [page.sort]);
  useEffect(() => {
    setGlobalFilter(page.q ?? '');
  }, [page.q]);
  useEffect(() => {
    setExpanded({});
  }, [rows]);

  const columns = useMemo<ColumnDef<ReleaseRow>[]>(
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
        accessorKey: 'name',
        header: 'Release Name',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className="block truncate" title={v}>
              {v}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          const bg = STATUS_COLORS[v] ?? '#ddd';
          const color = v === 'archived' ? '#000' : '#fff';
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
        accessorKey: 'type',
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
        accessorKey: 'semver',
        header: 'SemVer',
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
                  onClick={() => navigator.clipboard.writeText(row.original.name)}
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
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, expanded },
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      const sort = next[0];
      updateParams({
        limit: String(page.limit),
        offset: '0',
        sort: sort ? `${sort.id}:${sort.desc ? 'desc' : 'asc'}` : 'semver:desc',
        q: page.q,
      });
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => true,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const baseRows = table.getRowModel().rows;
  const expandedState = table.getState().expanded;
  const flatRows = useMemo(() => {
    const out: Array<{ row: Row<ReleaseRow>; type: 'data' | 'detail' }> = [];
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
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
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
      updateParams({ q: globalFilter || undefined, offset: '0', limit: String(page.limit), sort: page.sort });
    }, 300);
    return () => clearTimeout(handle);
  }, [globalFilter, page.limit, page.q, page.sort, updateParams]);

  const totalPages = Math.max(Math.ceil(total / page.limit), 1);
  const currentPage = Math.floor(page.offset / page.limit) + 1;
  const start = page.offset + 1;
  const end = Math.min(page.offset + rows.length, total);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="search"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className={styles.focusRing}
        />
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

      <div ref={parentRef} className={styles.tableContainer}>
        <div className={`grid grid-cols-[24px_minmax(280px,1fr)_140px_120px_120px_48px] ${styles.headerRow}`}>
          {table.getFlatHeaders().map((header) => {
            const sortable = header.column.getCanSort();
            const ariaSort = header.column.getIsSorted()
              ? header.column.getIsSorted() === 'asc'
                ? 'ascending'
                : 'descending'
              : 'none';
            return (
              <div
                key={header.id}
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
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            );
          })}
        </div>
        <div style={{ position: 'relative', height: `${totalSize}px` }}>
          {virtualItems.map((virtualRow) => {
            const item = flatRows[virtualRow.index];
            if (item.type === 'data') {
              const row = item.row;
              return (
                <div
                  key={row.id}
                  ref={rowVirtualizer.measureElement}
                  className={`grid grid-cols-[24px_minmax(280px,1fr)_140px_120px_120px_48px] ${styles.dataRow}`}
                  style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className={styles.focusRing}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            }
            const row = item.row;
            return (
              <div
                key={`${row.id}-detail`}
                ref={rowVirtualizer.measureElement}
                className="grid grid-cols-[24px_minmax(280px,1fr)_140px_120px_120px_48px]"
                style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}
              >
                <div className="col-span-6">
                  <ReleaseRowDetail id={row.original.id} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            updateParams({ offset: '0', limit: String(page.limit), sort: page.sort, q: page.q })
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

