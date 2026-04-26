"use client";

import { useMemo } from "react";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";

type TcdbTradeHallOfFamerRow = {
  partner?: string | null;
  categoryTags?: string[];
  inductionCount: number;
  latestInductedDate: string;
};

type Props = {
  rows: TcdbTradeHallOfFamerRow[];
};

function getPartnerProfileHref(partner: string): string {
  return `https://www.tcdb.com/Profile.cfm/${encodeURIComponent(partner)}`;
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

      return (a.partner ?? "").localeCompare(b.partner ?? "");
    });
  }, [rows]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          TCDb Trade Hall of Fame
        </h2>
        <p className="text-sm text-muted-foreground">
          Partners whose trades pushed a set across the finish line.
        </p>
      </div>

      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => {
            const key = row.partner?.trim() || "unknown";

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
                      {renderHallOfFamer(row.partner)}
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
        className="[&_th.tcdb-trade-compact]:px-3 [&_td.tcdb-trade-compact]:px-3"
        themeStyle={tcdbTradeTableThemeStyle}
      >
        <THead variant="bucks">
          <th scope="col">Hall of Famer</th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[120px] whitespace-nowrap"
          >
            Inductions
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[176px] whitespace-nowrap"
          >
            Latest Induction
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => {
              const key = row.partner?.trim() || "unknown";

              return (
                <tr
                  key={key}
                  className="border-b border-[color:var(--table-row-divider)] last:border-0"
                  data-testid="tcdb-trade-hof-row"
                >
                  <td className="[overflow-wrap:anywhere] font-medium">
                    {renderHallOfFamer(row.partner)}
                    {renderCategoryTags(row.categoryTags)}
                  </td>
                  <td className="tcdb-trade-compact whitespace-nowrap font-semibold tabular-nums">
                    {row.inductionCount}
                  </td>
                  <td className="tcdb-trade-compact whitespace-nowrap">
                    <time dateTime={row.latestInductedDate}>
                      {fmtDate(row.latestInductedDate)}
                    </time>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="text-sm text-ink/70">
                No Hall of Famer inductions yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </section>
  );
}
