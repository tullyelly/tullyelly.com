"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";

type TcdbTradeHallOfFameInductionRow = {
  setSlug: string;
  setName: string;
  releaseYear: number;
  manufacturer: string;
  categoryTag?: string;
  setHref?: string;
  tradeId: string;
  partner?: string | null;
  inductedDate: string;
  cardsOwned: number;
  totalCards: number;
};

type Props = {
  rows: TcdbTradeHallOfFameInductionRow[];
};

function getPartnerProfileHref(partner: string): string {
  return `https://www.tcdb.com/Profile.cfm/${encodeURIComponent(partner)}`;
}

function getFallbackSetCollectorDetailHref(setSlug: string): string {
  return `/cardattack/set-collector/${encodeURIComponent(setSlug)}`;
}

function renderHallOfFamer(partner?: string | null) {
  const trimmed = partner?.trim();

  if (!trimmed) {
    return <span className="text-muted-foreground">Unknown</span>;
  }

  return (
    <a
      href={getPartnerProfileHref(trimmed)}
      target="_blank"
      rel="noopener noreferrer"
      className="link-blue"
    >
      {trimmed}
    </a>
  );
}

function renderCategoryTag(categoryTag?: string) {
  return categoryTag ? (
    categoryTag
  ) : (
    <span className="text-muted-foreground">Unknown</span>
  );
}

export default function TcdbTradeHallOfFameInductionsTable({ rows }: Props) {
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.inductedDate.localeCompare(a.inductedDate));
  }, [rows]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Hall of Fame Inductions
        </h2>
        <p className="text-sm text-muted-foreground">
          The exact set completions that punched the ticket.
        </p>
      </div>

      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => {
            const setHref =
              row.setHref ?? getFallbackSetCollectorDetailHref(row.setSlug);

            return (
              <Card
                as="li"
                key={`mobile-induction-${row.setSlug}-${row.tradeId}`}
                className="p-3"
                data-testid="tcdb-trade-hof-induction-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-ink/60">
                      Set
                    </p>
                    <Link
                      href={setHref}
                      className="link-blue text-sm font-medium"
                    >
                      {row.setName}
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-ink/60">
                      Inducted
                    </p>
                    <time
                      dateTime={row.inductedDate}
                      className="text-sm whitespace-nowrap"
                    >
                      {fmtDate(row.inductedDate)}
                    </time>
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Category
                    </dt>
                    <dd>{renderCategoryTag(row.categoryTag)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Trade ID
                    </dt>
                    <dd className="tabular-nums">
                      <Link
                        href={`/cardattack/tcdb-trades/${row.tradeId}`}
                        className="link-blue"
                      >
                        {row.tradeId}
                      </Link>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Hall of Famer
                    </dt>
                    <dd className="[overflow-wrap:anywhere]">
                      {renderHallOfFamer(row.partner)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-ink/60">
                  {`${row.cardsOwned}/${row.totalCards} cards.`}
                </p>
              </Card>
            );
          })
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No Hall of Fame inductions yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Hall of Fame inductions table"
        data-testid="tcdb-trade-hof-inductions-table"
        className="[&_th.tcdb-trade-compact]:px-3 [&_td.tcdb-trade-compact]:px-3"
        themeStyle={tcdbTradeTableThemeStyle}
      >
        <THead variant="bucks">
          <th scope="col">Set</th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[144px] whitespace-nowrap"
          >
            Inducted
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[112px] whitespace-nowrap"
          >
            Category
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[112px] whitespace-nowrap"
          >
            Trade ID
          </th>
          <th scope="col" className="w-[220px]">
            Hall of Famer
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => {
              const setHref =
                row.setHref ?? getFallbackSetCollectorDetailHref(row.setSlug);

              return (
                <tr
                  key={`${row.setSlug}-${row.tradeId}`}
                  className="border-b border-[color:var(--table-row-divider)] last:border-0"
                  data-testid="tcdb-trade-hof-induction-row"
                >
                  <td>
                    <Link href={setHref} className="link-blue font-medium">
                      {row.setName}
                    </Link>
                  </td>
                  <td className="tcdb-trade-compact whitespace-nowrap">
                    <time dateTime={row.inductedDate}>
                      {fmtDate(row.inductedDate)}
                    </time>
                  </td>
                  <td className="tcdb-trade-compact whitespace-nowrap">
                    {renderCategoryTag(row.categoryTag)}
                  </td>
                  <td className="tcdb-trade-compact whitespace-nowrap font-medium tabular-nums">
                    <Link
                      href={`/cardattack/tcdb-trades/${row.tradeId}`}
                      className="link-blue"
                    >
                      {row.tradeId}
                    </Link>
                  </td>
                  <td className="[overflow-wrap:anywhere]">
                    {renderHallOfFamer(row.partner)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="text-sm text-ink/70">
                No Hall of Fame inductions yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </section>
  );
}
