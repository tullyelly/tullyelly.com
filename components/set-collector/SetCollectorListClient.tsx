"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
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
import { fmtDate } from "@/lib/datetime";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import {
  formatSetCollectorPercentComplete,
  formatSetCollectorRating,
} from "@/lib/set-collector-types";

type SetCollectorListRow = {
  id: number;
  setSlug: string;
  setName: string;
  releaseYear: number;
  manufacturer: string;
  totalCards: number;
  snapshotCount: number;
  categoryTag?: string;
  rating?: number;
  cardsOwned?: number;
  percentComplete?: number;
  latestSnapshotDate?: string;
};

type SetCollectorListClientProps = {
  rows: SetCollectorListRow[];
  detailBasePath: string;
  emptyMessage: string;
  tableAriaLabel: string;
  themeStyle?: CSSProperties;
  cardTestId?: string;
  tableTestId?: string;
  rowTestId?: string;
};

type SetSort = "default" | "name" | "year" | "progress";

const getSetSearchValues = (row: SetCollectorListRow) => [
  row.id,
  row.setSlug,
  row.setName,
  row.releaseYear,
  row.manufacturer,
  row.categoryTag,
];

const ratingBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--collector-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--collector-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--collector-ink)]/65";

function formatSnapshotDate(value?: string): string {
  return value ? fmtDate(value) : "Not available";
}

function formatRatingLabel(value?: number): string {
  return value === undefined ? "Not rated" : formatSetCollectorRating(value);
}

function formatLatestProgress(
  cardsOwned?: number,
  totalCards?: number,
  percentComplete?: number,
): { counts: string; percent: string } {
  if (totalCards === undefined) {
    return {
      counts: "Not available",
      percent: "Not available",
    };
  }

  if (cardsOwned === undefined || percentComplete === undefined) {
    return {
      counts: "Not available",
      percent: "No snapshot yet",
    };
  }

  return {
    counts: `${cardsOwned} / ${totalCards}`,
    percent: `${formatSetCollectorPercentComplete(percentComplete)} complete`,
  };
}

export default function SetCollectorListClient({
  rows,
  detailBasePath,
  emptyMessage,
  tableAriaLabel,
  themeStyle,
  cardTestId = "set-collector-card",
  tableTestId = "set-collector-table",
  rowTestId = "set-collector-row",
}: SetCollectorListClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SetSort>("default");
  const searchedRows = useTableSearch(rows, query, getSetSearchValues);
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          rows.flatMap((row) => (row.categoryTag ? [row.categoryTag] : [])),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const visibleRows = useMemo(() => {
    const filtered = searchedRows.filter(
      (row) => !category || row.categoryTag === category,
    );

    if (sort === "default") return filtered;

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.setName.localeCompare(b.setName);
      if (sort === "year") return b.releaseYear - a.releaseYear;
      return (b.percentComplete ?? -1) - (a.percentComplete ?? -1);
    });
  }, [category, searchedRows, sort]);
  const emptyState =
    rows.length === 0 ? emptyMessage : "No tracked sets match these filters.";

  return (
    <div className="space-y-4" style={themeStyle}>
      <DataToolbar
        ariaLabel="Set Collector controls"
        search={
          <TableSearch
            query={query}
            onQueryChange={setQuery}
            label="Search tracked sets"
            ariaControls="set-collector-table-view"
          />
        }
        filters={
          <>
            {categories.length > 1 ? (
              <select
                className="form-input w-full sm:w-auto"
                aria-label="Filter tracked sets by category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="form-input w-full sm:w-auto"
              aria-label="Sort tracked sets"
              value={sort}
              onChange={(event) => setSort(event.target.value as SetSort)}
            >
              <option value="default">Default order</option>
              <option value="name">Set name</option>
              <option value="year">Newest release</option>
              <option value="progress">Most complete</option>
            </select>
          </>
        }
        result={
          <DataResultCount>
            {visibleRows.length} tracked set
            {visibleRows.length === 1 ? "" : "s"}
          </DataResultCount>
        }
      />
      <ul className="space-y-4 md:hidden">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => {
            const progress = formatLatestProgress(
              row.cardsOwned,
              row.totalCards,
              row.percentComplete,
            );

            return (
              <Card
                as="li"
                key={`mobile-${row.id}`}
                className="overflow-hidden rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-0 shadow-sm"
                data-testid={cardTestId}
              >
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className={mobileMetaLabelClassName}>Tracked Set</p>
                      <Link
                        href={`${detailBasePath}/${row.setSlug}`}
                        className="block text-lg font-semibold leading-tight text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                      >
                        {row.setName}
                      </Link>
                    </div>
                    <span className={ratingBadgeClassName}>
                      {formatRatingLabel(row.rating)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Release Year</dt>
                      <dd className="font-semibold tabular-nums text-[color:var(--collector-ink)]">
                        {row.releaseYear}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>
                        Latest Snapshot
                      </dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {formatSnapshotDate(row.latestSnapshotDate)}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Manufacturer</dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {row.manufacturer}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Progress</dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {progress.counts}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {row.categoryTag ? (
                      <span className="rounded-full bg-[color:var(--collector-accent-soft)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                        {row.categoryTag}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[color:var(--collector-accent-wash)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                      {progress.percent}
                    </span>
                    <span className="rounded-full bg-[color:var(--collector-accent-wash)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                      {`${row.snapshotCount} ${row.snapshotCount === 1 ? "snapshot" : "snapshots"}`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-4 text-sm text-[color:var(--collector-ink)]/80 shadow-sm"
          >
            {emptyState}
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label={tableAriaLabel}
        data-testid={tableTestId}
        id="set-collector-table-view"
        themeStyle={themeStyle}
      >
        <THead variant="bucks">
          <TableHeaderCell intent="grow">Set</TableHeaderCell>
          <TableHeaderCell intent="numeric">Year</TableHeaderCell>
          <TableHeaderCell intent="nowrap">Manufacturer</TableHeaderCell>
          <TableHeaderCell intent="status">Category</TableHeaderCell>
          <TableHeaderCell intent="status">Rating</TableHeaderCell>
          <TableHeaderCell intent="compact">Latest Progress</TableHeaderCell>
          <TableHeaderCell intent="date">Latest Snapshot</TableHeaderCell>
        </THead>
        <TBody>
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => {
              const progress = formatLatestProgress(
                row.cardsOwned,
                row.totalCards,
                row.percentComplete,
              );

              return (
                <tr key={row.id} data-testid={rowTestId}>
                  <TableCell intent="grow">
                    <Link
                      href={`${detailBasePath}/${row.setSlug}`}
                      className="text-base font-semibold text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                    >
                      {row.setName}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--collector-ink)]/60">
                      {`${row.snapshotCount} ${row.snapshotCount === 1 ? "snapshot" : "snapshots"}`}
                    </p>
                  </TableCell>
                  <TableCell
                    intent="numeric"
                    className="font-semibold text-[color:var(--collector-ink)]"
                  >
                    {row.releaseYear}
                  </TableCell>
                  <TableCell
                    intent="nowrap"
                    className="font-semibold text-[color:var(--collector-ink)]"
                  >
                    {row.manufacturer}
                  </TableCell>
                  <TableCell
                    intent="status"
                    className="font-semibold text-[color:var(--collector-ink)]"
                  >
                    {row.categoryTag ?? "-"}
                  </TableCell>
                  <TableCell intent="status">
                    {row.rating !== undefined ? (
                      <span className={ratingBadgeClassName}>
                        {formatSetCollectorRating(row.rating)}
                      </span>
                    ) : (
                      <span className="font-semibold text-[color:var(--collector-ink)]/70">
                        Not rated
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    intent="compact"
                    className="font-semibold text-[color:var(--collector-ink)]"
                  >
                    <div>{progress.counts}</div>
                    <p className="mt-1 text-xs font-medium text-[color:var(--collector-ink)]/70">
                      {progress.percent}
                    </p>
                  </TableCell>
                  <TableCell
                    intent="date"
                    className="font-semibold text-[color:var(--collector-ink)]"
                  >
                    {row.latestSnapshotDate ? (
                      <time dateTime={row.latestSnapshotDate}>
                        {fmtDate(row.latestSnapshotDate)}
                      </time>
                    ) : (
                      "Not available"
                    )}
                  </TableCell>
                </tr>
              );
            })
          ) : (
            <TableEmptyRow
              colSpan={7}
              className="text-[color:var(--collector-ink)]/80"
            >
              {emptyState}
            </TableEmptyRow>
          )}
        </TBody>
      </Table>
    </div>
  );
}
