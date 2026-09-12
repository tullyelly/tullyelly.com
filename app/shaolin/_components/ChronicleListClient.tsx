"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Card } from "@ui";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
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
import type { AlterEgo } from "@/lib/alterEgo";
import { fmtDate } from "@/lib/datetime";
import { getHashtagDisplayName } from "@/lib/tags";

export type ChronicleListRow = {
  slug: string;
  url: string;
  title: string;
  summary: string;
  date: string;
  alterEgo: AlterEgo;
  tags: string[];
  infinityStone: boolean;
};

type SortOrder = "newest" | "oldest";

const PAGE_SIZES = [10, 25, 50];
const VISIBLE_TAGS = 3;
const getChronicleSearchValues = (row: ChronicleListRow) => [
  row.title,
  row.summary,
  row.date,
  fmtDate(row.date),
  row.slug,
  row.alterEgo,
  ...row.tags,
];

function TagLinks({ tags }: { tags: string[] }) {
  const visibleTags = tags.slice(0, VISIBLE_TAGS);
  const hiddenTagCount = tags.length - visibleTags.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <Link
          key={tag}
          href={`/shaolin/tags/${encodeURIComponent(tag)}` as Route}
          className="inline-flex"
          prefetch={false}
        >
          <Badge className={getBadgeClass("planned")}>
            {getHashtagDisplayName(tag)}
          </Badge>
        </Link>
      ))}
      {hiddenTagCount > 0 ? (
        <span
          title={`${hiddenTagCount} more tag${hiddenTagCount === 1 ? "" : "s"}`}
        >
          <Badge className={getBadgeClass("archived")}>+{hiddenTagCount}</Badge>
        </span>
      ) : null}
    </div>
  );
}

export default function ChronicleListClient({
  rows,
  alterEgos,
  initialAlterEgo = "",
}: {
  rows: ChronicleListRow[];
  alterEgos: readonly AlterEgo[];
  initialAlterEgo?: AlterEgo | "";
}) {
  const [query, setQuery] = useState("");
  const [alterEgo, setAlterEgo] = useState<AlterEgo | "">(initialAlterEgo);
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const searchedRows = useTableSearch(rows, query, getChronicleSearchValues);
  const filteredRows = useMemo(
    () => searchedRows.filter((row) => !alterEgo || row.alterEgo === alterEgo),
    [alterEgo, searchedRows],
  );
  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) => {
        const difference = b.date.localeCompare(a.date);
        return sort === "newest" ? difference : -difference;
      }),
    [filteredRows, sort],
  );
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters =
    query.length > 0 || alterEgo !== "" || sort !== "newest";

  function resetFilters() {
    setQuery("");
    setAlterEgo("");
    setSort("newest");
    setPage(1);
  }

  return (
    <div className="space-y-4" aria-label="Chronicles archive">
      <DataToolbar
        ariaLabel="Chronicle controls"
        search={
          <TableSearch
            query={query}
            onQueryChange={(nextQuery) => {
              setQuery(nextQuery);
              setPage(1);
            }}
            label="Search chronicles"
            placeholder="Search chronicles"
            ariaControls="chronicles-table"
          />
        }
        filters={
          <>
            <select
              className="form-input h-10 w-full sm:w-auto"
              aria-label="Filter chronicles by alter ego"
              value={alterEgo}
              onChange={(event) => {
                setAlterEgo(event.target.value as AlterEgo | "");
                setPage(1);
              }}
            >
              <option value="">All alter egos</option>
              {alterEgos.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="form-input h-10 w-full sm:w-auto"
              aria-label="Sort chronicles"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortOrder);
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </>
        }
        actions={
          hasActiveFilters ? (
            <button
              type="button"
              className="btn h-10 whitespace-nowrap text-sm"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          ) : null
        }
        result={
          <DataResultCount>
            {sortedRows.length} matching chronicle
            {sortedRows.length === 1 ? "" : "s"}
          </DataResultCount>
        }
      />

      <ul className="space-y-3 md:hidden">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <Card as="li" key={row.slug} className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={row.url as Route}
                    className="link-blue font-semibold"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {row.summary}
                  </p>
                </div>
                {row.infinityStone ? (
                  <span aria-label="Infinity Stone" title="Infinity Stone">
                    💎
                  </span>
                ) : null}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Date
                  </dt>
                  <dd>
                    <time dateTime={row.date}>{fmtDate(row.date)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Alter Ego
                  </dt>
                  <dd>{row.alterEgo}</dd>
                </div>
              </dl>
              {row.tags.length > 0 ? <TagLinks tags={row.tags} /> : null}
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No chronicles match these filters.
          </Card>
        )}
      </ul>

      <Table
        id="chronicles-table"
        variant="bucks"
        aria-label="Chronicles table"
      >
        <THead variant="bucks">
          <TableHeaderCell intent="date">Date</TableHeaderCell>
          <TableHeaderCell intent="grow">Chronicle</TableHeaderCell>
          <TableHeaderCell intent="status">Alter Ego</TableHeaderCell>
          <TableHeaderCell intent="descriptive">Tags</TableHeaderCell>
        </THead>
        <TBody>
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => (
              <tr key={row.slug}>
                <TableCell intent="date" className="align-top">
                  <time dateTime={row.date}>{fmtDate(row.date)}</time>
                </TableCell>
                <TableCell intent="grow" className="align-top">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <Link
                        href={row.url as Route}
                        className="link-blue font-semibold"
                      >
                        {row.title}
                      </Link>
                      <p className="mt-1 text-sm leading-snug text-muted-foreground">
                        {row.summary}
                      </p>
                    </div>
                    {row.infinityStone ? (
                      <span
                        className="shrink-0"
                        aria-label="Infinity Stone"
                        title="Infinity Stone"
                      >
                        💎
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell intent="status" className="align-top">
                  {row.alterEgo}
                </TableCell>
                <TableCell intent="descriptive" className="align-top">
                  {row.tags.length > 0 ? (
                    <TagLinks tags={row.tags} />
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                </TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={4}>
              No chronicles match these filters.
            </TableEmptyRow>
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
      />
    </div>
  );
}
