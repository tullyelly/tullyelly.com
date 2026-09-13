"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@ui";

import SectionHeader from "@/components/layout/SectionHeader";
import {
  Table,
  TableCell,
  TableEmptyRow,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";

type TcdbTradeHallOfFamerRow = {
  tradePartnerId: number;
  tcdbUsername: string;
  name?: string;
  categoryTags?: string[];
  inductionCount: number;
  latestInductedDate: string;
};

type Props = {
  rows: TcdbTradeHallOfFamerRow[];
};

function renderHallOfFamer(row: TcdbTradeHallOfFamerRow) {
  return (
    <Link
      href={`/cardattack/tcdb-trade-partners/${row.tradePartnerId}`}
      className="link-blue"
    >
      {row.tcdbUsername}
      {row.name ? ` (${row.name})` : ""}
    </Link>
  );
}

function renderCategoryTags(categoryTags?: string[]) {
  const tags = categoryTags?.filter(Boolean) ?? [];

  if (tags.length === 0) {
    return null;
  }

  return (
    <span className="text-muted-foreground">{` (${tags.join(", ")})`}</span>
  );
}

export default function TcdbTradeHallOfFameTable({ rows }: Props) {
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const inductionDelta = b.inductionCount - a.inductionCount;

      if (inductionDelta !== 0) {
        return inductionDelta;
      }

      const latestDateDelta = b.latestInductedDate.localeCompare(
        a.latestInductedDate,
      );

      if (latestDateDelta !== 0) {
        return latestDateDelta;
      }

      return a.tcdbUsername.localeCompare(b.tcdbUsername);
    });
  }, [rows]);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="TCDb Trade Hall of Fame"
        description="Partners whose trades pushed a set across the finish line."
      />

      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => {
            const key = row.tradePartnerId;

            return (
              <Card
                as="li"
                key={`mobile-hof-${key}`}
                className="p-3"
                data-testid="tcdb-trade-hof-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-ink/60">
                      Hall of Famer
                    </p>
                    <p className="[overflow-wrap:anywhere] text-sm font-medium">
                      {renderHallOfFamer(row)}
                      {renderCategoryTags(row.categoryTags)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-ink/60">
                      Inductions
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {row.inductionCount}
                    </p>
                  </div>
                </div>
                <dl className="mt-2 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink/60">
                      Latest Induction
                    </dt>
                    <dd>
                      <time dateTime={row.latestInductedDate}>
                        {fmtDate(row.latestInductedDate)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </Card>
            );
          })
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No Hall of Famer inductions yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="TCDb Trade Hall of Fame table"
        data-testid="tcdb-trade-hof-table"
        themeStyle={tcdbTradeTableThemeStyle}
      >
        <THead variant="bucks">
          <TableHeaderCell intent="grow">Hall of Famer</TableHeaderCell>
          <TableHeaderCell intent="numeric">Inductions</TableHeaderCell>
          <TableHeaderCell intent="date">Latest Induction</TableHeaderCell>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => {
              const key = row.tradePartnerId;

              return (
                <tr key={key} data-testid="tcdb-trade-hof-row">
                  <TableCell intent="grow" className="font-medium">
                    {renderHallOfFamer(row)}
                    {renderCategoryTags(row.categoryTags)}
                  </TableCell>
                  <TableCell intent="numeric" className="font-semibold">
                    {row.inductionCount}
                  </TableCell>
                  <TableCell intent="date">
                    <time dateTime={row.latestInductedDate}>
                      {fmtDate(row.latestInductedDate)}
                    </time>
                  </TableCell>
                </tr>
              );
            })
          ) : (
            <TableEmptyRow colSpan={3}>
              No Hall of Famer inductions yet.
            </TableEmptyRow>
          )}
        </TBody>
      </Table>
    </section>
  );
}
