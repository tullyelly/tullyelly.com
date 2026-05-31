"use client";

import { useCallback, useMemo, useTransition } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import TrendPill from "./TrendPill";
import type {
  TCDBRankingTableData,
  TCDBRankingTableLabels,
  TCDBRankingTableTheme,
} from "./TCDBRankingTable";
import { Table, TBody, THead } from "@/components/ui/Table";
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
};

export default function TCDBRankingTableClient({
  serverData,
  theme,
  labels,
}: TCDBRankingTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname ?? "";
  const search = useSearchParams();
  const searchSnapshot = search?.toString() ?? "";
  const [isPending, startTransition] = useTransition();

  const searchQ = search?.get("q") ?? "";
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
      const formData = new FormData(event.currentTarget);
      const nextQ = String(formData.get("q") ?? "");
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

  const hasRows = rows.length > 0;
  const { meta } = serverData;

  return (
    <section
      className="space-y-4"
      aria-live="polite"
      aria-busy={isPending ? "true" : undefined}
      role="region"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          key={searchSnapshot}
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center"
          role="search"
          aria-label={labels.searchAriaLabel}
        >
          <div className="flex w-full items-center gap-2">
            <input
              name="q"
              defaultValue={searchQ}
              placeholder={labels.searchPlaceholder}
              className="form-input h-9 w-full md:w-64"
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
          </div>
          <div aria-live="polite" className="sr-only">
            {isPending ? "Updating results" : "Results ready"}
          </div>
        </form>
        <div className="md:min-w-[12rem]">
          <select
            name="trend"
            defaultValue={searchTrend}
            onChange={onTrendChange}
            className="form-input h-9 w-full"
            aria-label="Filter by trend"
          >
            <option value="">All trends</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="flat">Flat</option>
          </select>
        </div>
      </div>

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
        data-testid="tcdb-rankings-table"
        className="thead-sticky"
        themeStyle={theme?.tableThemeStyle}
      >
        <THead variant="bucks">
          <th scope="col" className="w-[140px]">
            {labels.identifierColumn}
          </th>
          <th scope="col">Name</th>
          <th scope="col" className="w-[140px]">
            Cards
          </th>
          <th scope="col" className="w-[72px]">
            Rank
          </th>
          <th scope="col" className="w-[160px]">
            Trend
          </th>
        </THead>
        <TBody>
          {hasRows ? (
            rows.map((row) => (
              <tr
                key={row.key}
                data-testid="tcdb-table-row"
                className="border-b border-[color:var(--table-row-divider)] last:border-0"
              >
                <td className="text-ink/80">
                  <TCDBRankingRowClient href={row.href} name={row.name}>
                    <span className="block max-w-[10rem] truncate">
                      {row.identifierValue}
                    </span>
                  </TCDBRankingRowClient>
                </td>
                <td className="truncate text-ink">
                  <span className="block" title={row.name}>
                    {row.name}
                  </span>
                </td>
                <td className="tabular-nums text-ink">
                  {integerFormatter.format(row.card_count)}
                </td>
                <td className="tabular-nums text-ink/80">
                  {integerFormatter.format(row.ranking)}
                </td>
                <td>
                  <TrendPill trend={row.trend_overall} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-sm text-ink/70"
              >
                {labels.emptyMessage}
              </td>
            </tr>
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
