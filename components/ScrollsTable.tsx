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
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'release_type',
        header: 'Type',
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return <time dateTime={v}>{v}</time>;
        },
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
      const params = new URLSearchParams(searchParams);
      params.set('limit', String(page.limit));
      params.set('offset', '0');
      const sortStr = sort ? `${sort.id}:${sort.desc ? 'desc' : 'asc'}` : 'created_at:desc';
      params.set('sort', sortStr);
      if (page.q) params.set('q', page.q);
      router.push(`?${params.toString()}`, { scroll: false });
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

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (globalFilter === (page.q ?? '')) return;
      updateParams({ q: globalFilter || undefined, offset: '0', limit: String(page.limit), sort: page.sort });
    }, 300);
    return () => clearTimeout(handle);
  }, [globalFilter, page.limit, page.q, page.sort, updateParams]);

  const start = page.offset + 1;
  const end = Math.min(page.offset + rows.length, total);
  const canPrev = page.offset > 0;
  const canNext = page.offset + page.limit < total;

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
        <div className="flex flex-wrap gap-2">
          {table
            .getAllLeafColumns()
            .filter((c) => c.id !== 'expander')
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

      <div className="mt-2 flex items-center gap-4">
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
          Previous
        </button>
        <span>
          showing {start}-{end} of {total}
        </span>
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
          Next
        </button>
        <label className="ml-auto flex items-center gap-1">
          <span>Page size</span>
          <select
            value={page.limit}
            onChange={(e) =>
              updateParams({ limit: e.target.value, offset: '0', sort: page.sort, q: page.q })
            }
            className={styles.focusRing}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
