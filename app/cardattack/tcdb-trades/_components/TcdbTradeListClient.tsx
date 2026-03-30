"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { Card } from "@ui";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";

type Props = {
  rows: {
    tradeId: string;
    startDate: string;
    endDate?: string;
    received?: number;
    sent?: number;
    total?: number;
    partner?: string;
    status: "Open" | "Completed";
  }[];
};

function getTradeStatusBadgeClass(status: "Open" | "Completed") {
  return getBadgeClass(status === "Open" ? "tcdb" : "spike");
}

function renderPartner(partner?: string) {
  if (!partner) {
    return <span className="text-muted-foreground">Unknown</span>;
  }
  return (
    <a
      href={`https://www.tcdb.com/Profile.cfm/${encodeURIComponent(partner)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link-blue"
    >
      {partner}
    </a>
  );
}

function renderTradeCount(value?: number) {
  if (value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span className="tabular-nums">{value}</span>;
}

export default function TcdbTradeListClient({ rows }: Props) {
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => Number(b.tradeId) - Number(a.tradeId));
  }, [rows]);

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.tradeId}`}
              className="p-3"
              data-testid="tcdb-trade-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    Trade ID
                  </p>
                  <Link
                    href={`/cardattack/tcdb-trades/${row.tradeId}`}
                    className="link-blue text-sm font-medium"
                  >
                    {row.tradeId}
                  </Link>
                </div>
                <Badge
                  className={getTradeStatusBadgeClass(row.status)}
                >
                  {row.status}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Start Date
                  </dt>
                  <dd>
                    <time dateTime={row.startDate}>
                      {fmtDate(row.startDate)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    End Date
                  </dt>
                  <dd>
                    {row.endDate ? (
                      <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
                    ) : (
                      "Open"
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-ink/60">
                  Partner
                </p>
                <p>{renderPartner(row.partner)}</p>
              </div>
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No TCDb trades have been referenced in chronicles yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="TCDB trades table"
        data-testid="tcdb-trade-table"
        className="[&_th.tcdb-trade-compact]:px-3 [&_td.tcdb-trade-compact]:px-3"
        themeStyle={tcdbTradeTableThemeStyle}
      >
        <THead variant="bucks">
          <th scope="col" className="w-[104px] whitespace-nowrap">
            Trade ID
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[116px] whitespace-nowrap"
          >
            Status
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[132px] whitespace-nowrap"
          >
            Started
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[132px] whitespace-nowrap"
          >
            Completed
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[76px] whitespace-nowrap"
          >
            Received
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[76px] whitespace-nowrap"
          >
            Sent
          </th>
          <th
            scope="col"
            className="tcdb-trade-compact w-[76px] whitespace-nowrap"
          >
            Total
          </th>
          <th scope="col">Partner</th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.tradeId}
                className="border-b border-[color:var(--table-row-divider)] last:border-0"
                data-testid="tcdb-trade-row"
              >
                <td className="font-medium tabular-nums">
                  <Link
                    href={`/cardattack/tcdb-trades/${row.tradeId}`}
                    className="link-blue"
                  >
                    {row.tradeId}
                  </Link>
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  <Badge className={getTradeStatusBadgeClass(row.status)}>
                    {row.status}
                  </Badge>
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  <time dateTime={row.startDate}>{fmtDate(row.startDate)}</time>
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  {row.endDate ? (
                    <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
                  ) : (
                    "Open"
                  )}
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  {renderTradeCount(row.received)}
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  {renderTradeCount(row.sent)}
                </td>
                <td className="tcdb-trade-compact whitespace-nowrap">
                  {renderTradeCount(row.total)}
                </td>
                <td className="[overflow-wrap:anywhere]">
                  {renderPartner(row.partner)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-sm text-ink/70">
                No TCDB trades have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
