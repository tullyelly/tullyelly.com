"use client";

import { useCallback, useMemo, useTransition } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import TrendPill from "./TrendPill";
import type {
  TCDBRankingTableData,
  TCDBRankingTableLabels,
  TCDBRankingSportOption,
  TCDBRankingTableTheme,
} from "./TCDBRankingTable";
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
import { Card } from "@ui";
import { BusyButton } from "@/components/ui/busy-button";
import TCDBRankingRowClient from "@/components/tcdb/TCDBRankingRowClient";

type Row = TCDBRankingTableData["data"][number];

const integerFormatter = new Intl.NumberFormat("en-US");
const signedFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "always",
});

export type TCDBRankingTableClientProps = {
  serverData: TCDBRankingTableData;
  theme?: TCDBRankingTableTheme;
  labels: TCDBRankingTableLabels;
  sportOptions?: TCDBRankingSportOption[];
};

export default function TCDBRankingTableClient({
  serverData,
  theme,
  labels,
  sportOptions,
}: TCDBRankingTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const search = useSearchParams();
  const searchSnapshot = search?.toString() ?? "";
  const [isPending, startTransition] = useTransition();

  const searchQ = search?.get("q") ?? "";
  const searchSport = (search?.get("sport") ?? "").trim().toLowerCase();
  const searchTrend = search?.get("trend") ?? "";

  const rows = useMemo(
    () => [...serverData.data].sort((a, b) => b.card_count - a.card_count),
    [serverData.data],
  );

  const updateQuery = useCallback(
    (
      next: Record<string, string | undefined>,
      options: { resetPage?: boolean } = {},
    ) => {
      const { resetPage = false } = options;
      const current = new URLSearchParams(searchSnapshot);
      Object.entries(next).forEach(([key, value]) => {
        if (!value) current.delete(key);
        else current.set(key, value);
      });
      if (resetPage) {
        current.delete("page");
      }
      const queryString = current.toString();
      startTransition(() => {
        const nextPath = queryString
          ? `${currentPath}?${queryString}`
          : currentPath;
        router.replace(nextPath as Route);
      });
    },
    [currentPath, router, searchSnapshot, startTransition],
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const queryInput = event.currentTarget.elements.namedItem("q");
      const nextQ =
        queryInput instanceof HTMLInputElement ? queryInput.value : "";
      updateQuery({ q: nextQ || undefined }, { resetPage: true });
    },
    [updateQuery],
  );

  const onTrendChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      updateQuery({ trend: value || undefined }, { resetPage: true });
    },
    [updateQuery],
  );

  const onSportChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      updateQuery({ sport: value || undefined }, { resetPage: true });
    },
    [updateQuery],
  );

  const hasRows = rows.length > 0;
  const { meta } = serverData;

  return (
    <section
      className="space-y-4"
      aria-busy={isPending ? "true" : undefined}
      role="region"
    >
      <DataToolbar
        ariaLabel="Ranking controls"
        search={
          <form
            key={searchSnapshot}
            onSubmit={onSubmit}
            className="flex w-full items-center gap-2"
            role="search"
            aria-label={labels.searchAriaLabel}
          >
            <input
              name="q"
              defaultValue={searchQ}
              placeholder={labels.searchPlaceholder}
              className="form-input w-full sm:w-72"
              aria-label={labels.searchAriaLabel}
              type="search"
            />
            <BusyButton
              type="submit"
              className="btn shrink-0"
              isLoading={isPending}
              loadingLabel="Searching..."
            >
              Search
            </BusyButton>
          </form>
        }
        filters={
          <>
            {sportOptions?.length ? (
              <select
                name="sport"
                value={searchSport}
                onChange={onSportChange}
                className="form-input w-full sm:w-auto"
                aria-label="Filter by sport"
              >
                <option value="">All sports</option>
                {sportOptions.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              name="trend"
              value={searchTrend}
              onChange={onTrendChange}
              className="form-input w-full sm:w-auto"
              aria-label="Filter by trend"
            >
              <option value="">All trends</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="flat">Flat</option>
            </select>
          </>
        }
        result={
          <>
            <DataResultCount>
              {meta.total} ranking result{meta.total === 1 ? "" : "s"}
            </DataResultCount>
            <span aria-live="polite" className="sr-only">
              {isPending ? "Updating results" : "Results ready"}
            </span>
          </>
        }
      />

      <ul className="space-y-3 md:hidden">
        {hasRows ? (
          rows.map((row) => <MobileRankingCard key={row.key} row={row} />)
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            {labels.emptyMessage}
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label={labels.tableAriaLabel}
        data-testid="tcdb-ranking-table"
        className="thead-sticky"
        themeStyle={theme?.tableThemeStyle}
      >
        <THead variant="bucks">
          <TableHeaderCell intent="identifier">
            {labels.identifierColumn}
          </TableHeaderCell>
          <TableHeaderCell intent="grow">Name</TableHeaderCell>
          <TableHeaderCell intent="numeric">Cards</TableHeaderCell>
          <TableHeaderCell intent="numeric">Rank</TableHeaderCell>
          <TableHeaderCell intent="status">Trend</TableHeaderCell>
        </THead>
        <TBody>
          {hasRows ? (
            rows.map((row) => (
              <tr key={row.key} data-testid="tcdb-table-row">
                <TableCell intent="identifier" className="text-ink/80">
                  <TCDBRankingRowClient href={row.href} name={row.name}>
                    <span className="block max-w-[10rem] truncate">
                      {row.identifierValue}
                    </span>
                  </TCDBRankingRowClient>
                </TableCell>
                <TableCell intent="grow" className="text-ink">
                  {row.name}
                </TableCell>
                <TableCell intent="numeric" className="text-ink">
                  {integerFormatter.format(row.card_count)}
                </TableCell>
                <TableCell intent="numeric" className="text-ink/80">
                  {integerFormatter.format(row.ranking)}
                </TableCell>
                <TableCell intent="status">
                  <TrendPill trend={row.trend_overall} />
                </TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={5}>{labels.emptyMessage}</TableEmptyRow>
          )}
        </TBody>
      </Table>

      <TablePager
        page={meta.page}
        pageSize={meta.pageSize}
        total={meta.total}
        isPending={isPending}
        onPageChange={(nextPage) => updateQuery({ page: String(nextPage) })}
        onPageSizeChange={(nextSize) =>
          updateQuery({ pageSize: String(nextSize) }, { resetPage: true })
        }
      />
    </section>
  );
}

function MobileRankingCard({ row }: { row: Row }) {
  return (
    <Card as="li" className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink">{row.name}</p>
          <p className="text-xs text-ink/70">
            Rank {integerFormatter.format(row.ranking)}
          </p>
        </div>
        <TrendPill trend={row.trend_overall} />
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <dt className="text-xs uppercase text-ink/60">
            {row.identifierLabel}
          </dt>
          <dd className="truncate text-ink">{row.identifierValue}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-ink/60">Cards</dt>
          <dd className="tabular-nums text-ink">
            {integerFormatter.format(row.card_count)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-ink/60">Difference</dt>
          <dd className="tabular-nums text-ink">
            {signedFormatter.format(row.difference)}
          </dd>
        </div>
      </dl>
      <TCDBRankingRowClient
        href={row.href}
        name={row.name}
        className="mt-3 text-sm"
      />
    </Card>
  );
}
