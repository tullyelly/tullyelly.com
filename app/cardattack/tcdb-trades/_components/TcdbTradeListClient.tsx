"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { Card } from "@ui";
import { fmtDate } from "@/lib/datetime";

type Props = {
  rows: {
    tradeId: string;
    startDate: string;
    endDate?: string;
    partner?: string;
    status: "Open" | "Completed";
  }[];
};

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
                  className={getBadgeClass(
                    row.status === "Open" ? "chore" : "spike",
                  )}
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
      >
        <THead variant="bucks">
          <th scope="col" className="w-[110px] whitespace-nowrap">
            Trade ID
          </th>
          <th scope="col" className="w-[150px] whitespace-nowrap">
            Started
          </th>
          <th scope="col" className="w-[150px] whitespace-nowrap">
            Completed
          </th>
          <th scope="col">Partner</th>
          <th scope="col" className="w-[130px] whitespace-nowrap">
            Status
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.tradeId}
                className="border-b border-black/5 last:border-0"
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
                <td className="whitespace-nowrap">
                  <time dateTime={row.startDate}>{fmtDate(row.startDate)}</time>
                </td>
                <td className="whitespace-nowrap">
                  {row.endDate ? (
                    <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
                  ) : (
                    "Open"
                  )}
                </td>
                <td>{renderPartner(row.partner)}</td>
                <td className="whitespace-nowrap">
                  <Badge
                    className={getBadgeClass(
                      row.status === "Open" ? "chore" : "spike",
                    )}
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-sm text-ink/70">
                No TCDB trades have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
