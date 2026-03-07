"use client";

import Link from "next/link";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";

type TcdbTradeRow = {
  tradeId: string;
  startDate: string;
  endDate?: string;
  partner?: string;
  status: "Open" | "Completed";
};

type TcdbTradeListClientProps = {
  rows: TcdbTradeRow[];
};

function StatusPill({ status }: { status: TcdbTradeRow["status"] }) {
  const className =
    status === "Completed"
      ? "inline-flex items-center rounded-full bg-[var(--cream)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink"
      : "inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink";

  return <span className={className}>{status}</span>;
}

export default function TcdbTradeListClient({ rows }: TcdbTradeListClientProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No TCDB trades have been referenced in chronicles yet.
      </p>
    );
  }

  return (
    <Table
      showOnMobile
      aria-label="TCDB trades table"
      data-testid="tcdb-trade-table"
    >
      <THead>
        <th scope="col">Trade</th>
        <th scope="col">Partner</th>
        <th scope="col">Start Date</th>
        <th scope="col">End Date</th>
        <th scope="col">Status</th>
      </THead>
      <TBody>
        {rows.map((row) => (
          <tr key={row.tradeId} className="border-b border-black/5 last:border-0">
            <td className="font-medium">
              <Link href={`/cardattack/tcdb-trade/${row.tradeId}`} className="link-blue">
                {row.tradeId}
              </Link>
            </td>
            <td>{row.partner ?? "Not listed"}</td>
            <td>
              <time dateTime={row.startDate}>{fmtDate(row.startDate)}</time>
            </td>
            <td>
              {row.endDate ? (
                <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
              ) : (
                "Not completed"
              )}
            </td>
            <td>
              <StatusPill status={row.status} />
            </td>
          </tr>
        ))}
      </TBody>
    </Table>
  );
}
