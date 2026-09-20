"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import {
  MobileDataCard,
  MobileDataEmptyState,
  MobileDataField,
  MobileDataGrid,
} from "@/components/ui/MobileDataCard";
import {
  Table,
  TableCell,
  TableEmptyRow,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import TablePager from "@/components/ui/TablePager";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";

export type TagDirectoryRow = {
  slug: string;
  canonicalDisplayName: string;
  chronicleCount: number;
  alias: {
    href: string;
    label: string;
    external: boolean;
  } | null;
  personTagNames: Array<{ displayName: string; count: number }>;
  remainingPersonTagNameCount: number;
};

type SortOrder = "usage" | "alphabetical";
const PAGE_SIZES = [25, 50, 100];

export default function TagDirectoryClient({
  rows,
}: {
  rows: TagDirectoryRow[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("usage");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const searchedRows = useTableSearch(rows, query, (row) => [
    row.slug,
    row.canonicalDisplayName,
    row.alias?.label ?? "",
    row.alias?.href ?? "",
    ...row.personTagNames.map((name) => name.displayName),
  ]);
  const sortedRows = useMemo(
    () =>
      [...searchedRows].sort((a, b) =>
        sort === "usage"
          ? b.chronicleCount - a.chronicleCount || a.slug.localeCompare(b.slug)
          : a.slug.localeCompare(b.slug),
      ),
    [searchedRows, sort],
  );
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const emptyMessage =
    rows.length === 0
      ? "No Chronicle tags are available yet."
      : "No Chronicle tags match this search.";

  function AliasLink({ row }: { row: TagDirectoryRow }) {
    if (!row.alias) return <span className="text-muted-foreground">None</span>;

    return (
      <a
        href={row.alias.href}
        className="link-blue"
        {...(row.alias.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {row.alias.label}
        {row.alias.external ? " (opens in a new tab)" : ""}
      </a>
    );
  }

  function PersonTagNames({ row }: { row: TagDirectoryRow }) {
    if (row.personTagNames.length === 0) {
      return <span className="text-muted-foreground">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {row.personTagNames.map((name) => (
          <span
            key={name.displayName}
            className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/80"
          >
            {name.displayName} ({name.count})
          </span>
        ))}
        {row.remainingPersonTagNameCount > 0 ? (
          <span className="self-center text-xs text-muted-foreground">
            +{row.remainingPersonTagNameCount} more
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-label="Chronicle tag directory">
      <DataToolbar
        ariaLabel="Tag directory controls"
        search={
          <TableSearch
            query={query}
            onQueryChange={(nextQuery) => {
              setQuery(nextQuery);
              setPage(1);
            }}
            label="Search Chronicle tags"
            placeholder="Search tags"
            ariaControls="chronicle-tags-table"
          />
        }
        filters={
          <select
            className="form-input h-10 w-full sm:w-auto"
            aria-label="Sort Chronicle tags"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortOrder);
              setPage(1);
            }}
          >
            <option value="usage">Most used</option>
            <option value="alphabetical">Alphabetical A-Z</option>
          </select>
        }
        result={
          <DataResultCount>
            {sortedRows.length} matching tag{sortedRows.length === 1 ? "" : "s"}
          </DataResultCount>
        }
      />

      <ul className="space-y-3 md:hidden">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <MobileDataCard key={row.slug}>
              <Link
                href={`/shaolin/tags/${encodeURIComponent(row.slug)}` as Route}
                className="link-blue font-semibold"
                prefetch={false}
              >
                #{row.slug}
              </Link>
              <MobileDataGrid className="grid-cols-1">
                <MobileDataField label="Chronicles">
                  {row.chronicleCount}
                </MobileDataField>
                <MobileDataField label="Also found at">
                  <AliasLink row={row} />
                </MobileDataField>
                <MobileDataField label="Names used">
                  <PersonTagNames row={row} />
                </MobileDataField>
              </MobileDataGrid>
            </MobileDataCard>
          ))
        ) : (
          <MobileDataEmptyState>{emptyMessage}</MobileDataEmptyState>
        )}
      </ul>

      <Table
        id="chronicle-tags-table"
        variant="bucks"
        layout="fixed"
        aria-label="Chronicle tags table"
      >
        <THead variant="bucks">
          <TableHeaderCell className="w-1/5">Tag</TableHeaderCell>
          <TableHeaderCell intent="numeric">Chronicles</TableHeaderCell>
          <TableHeaderCell className="w-44">Also found at</TableHeaderCell>
          <TableHeaderCell>Names used</TableHeaderCell>
        </THead>
        <TBody>
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => (
              <tr key={row.slug}>
                <TableCell>
                  <Link
                    href={
                      `/shaolin/tags/${encodeURIComponent(row.slug)}` as Route
                    }
                    className="link-blue font-semibold"
                    prefetch={false}
                  >
                    #{row.slug}
                  </Link>
                </TableCell>
                <TableCell intent="numeric">{row.chronicleCount}</TableCell>
                <TableCell>
                  <AliasLink row={row} />
                </TableCell>
                <TableCell>
                  <PersonTagNames row={row} />
                </TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={4}>{emptyMessage}</TableEmptyRow>
          )}
        </TBody>
      </Table>

      <TablePager
        page={page}
        pageSize={pageSize}
        total={sortedRows.length}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        pageSizeOptions={PAGE_SIZES}
        ariaLabel="Chronicle tag pagination"
      />
    </div>
  );
}
