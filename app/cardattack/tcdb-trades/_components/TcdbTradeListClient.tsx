"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import {
  MobileDataCard,
  MobileDataCardHeader,
  MobileDataEmptyState,
  MobileDataField,
  MobileDataGrid,
} from "@/components/ui/MobileDataCard";
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
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";

type Props = {
  rows: {
    tradeId: string;
    startDate: string;
    endDate?: string;
    received?: number;
    sent?: number;
    total?: number;
    tradePartnerId: number;
    partner: string;
    partnerName?: string;
    status: "Open" | "Completed";
  }[];
};

type TradeRow = Props["rows"][number];

const getTradeSearchValues = (row: TradeRow) => [
  row.tradeId,
  row.status,
  row.startDate,
  row.endDate,
  row.received,
  row.sent,
  row.total,
  row.partner,
  row.partnerName,
];

function getTradeStatusBadgeClass(status: "Open" | "Completed") {
  return getBadgeClass(status === "Open" ? "tcdb" : "spike");
}

function renderPartner(row: TradeRow) {
  return (
    <Link
      href={`/cardattack/tcdb-trade-partners/${row.tradePartnerId}`}
      className="link-blue"
    >
      {row.partner}
      {row.partnerName ? ` (${row.partnerName})` : ""}
    </Link>
  );
}

function renderTradeCount(value?: number) {
  if (value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span className="tabular-nums">{value}</span>;
}

export default function TcdbTradeListClient({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const searchedRows = useTableSearch(rows, query, getTradeSearchValues);
  const visibleRows = useMemo(() => {
    const filtered = searchedRows.filter(
      (row) => !status || row.status === status,
    );
    return [...filtered].sort((a, b) => {
      const difference = Number(b.tradeId) - Number(a.tradeId);
      return sort === "newest" ? difference : -difference;
    });
  }, [searchedRows, sort, status]);
  const emptyState =
    rows.length === 0
      ? "No TCDb trades have been referenced in chronicles yet."
      : "No TCDb trades match these filters.";

  return (
    <section
      id="tcdb-trades-data-view"
      className="space-y-4"
      aria-label="TCDb trades ledger"
    >
      <DataToolbar
        ariaLabel="TCDb trade controls"
        search={
          <TableSearch
            query={query}
            onQueryChange={setQuery}
            label="Search TCDb trades"
            ariaControls="tcdb-trades-data-view"
          />
        }
        filters={
          <>
            <select
              className="form-input w-full sm:w-auto"
              aria-label="Filter TCDb trades by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              className="form-input w-full sm:w-auto"
              aria-label="Sort TCDb trades"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Newest trade first</option>
              <option value="oldest">Oldest trade first</option>
            </select>
          </>
        }
        result={
          <DataResultCount>
            {visibleRows.length} TCDb trade
            {visibleRows.length === 1 ? "" : "s"} shown
          </DataResultCount>
        }
      />
      <ul className="space-y-3 md:hidden">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <MobileDataCard
              key={`mobile-${row.tradeId}`}
              className="p-3"
              data-testid="tcdb-trade-card"
            >
              <MobileDataCardHeader
                eyebrow="Trade ID"
                title={
                  <Link
                    href={`/cardattack/tcdb-trades/${row.tradeId}`}
                    className="link-blue text-sm font-medium"
                  >
                    {row.tradeId}
                  </Link>
                }
                trailing={
                  <Badge className={getTradeStatusBadgeClass(row.status)}>
                    {row.status}
                  </Badge>
                }
              />
              <MobileDataGrid>
                <MobileDataField label="Start date">
                  <time dateTime={row.startDate}>{fmtDate(row.startDate)}</time>
                </MobileDataField>
                <MobileDataField label="End date">
                  {row.endDate ? (
                    <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
                  ) : (
                    "Open"
                  )}
                </MobileDataField>
              </MobileDataGrid>
              <div className="mt-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-ink/60">
                  Partner
                </p>
                <p>{renderPartner(row)}</p>
              </div>
            </MobileDataCard>
          ))
        ) : (
          <MobileDataEmptyState>{emptyState}</MobileDataEmptyState>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="TCDB trades table"
        data-testid="tcdb-trade-table"
        themeStyle={tcdbTradeTableThemeStyle}
      >
        <THead variant="bucks">
          <TableHeaderCell intent="identifier">Trade ID</TableHeaderCell>
          <TableHeaderCell intent="status">Status</TableHeaderCell>
          <TableHeaderCell intent="date">Started</TableHeaderCell>
          <TableHeaderCell intent="date">Completed</TableHeaderCell>
          <TableHeaderCell intent="numeric">Received</TableHeaderCell>
          <TableHeaderCell intent="numeric">Sent</TableHeaderCell>
          <TableHeaderCell intent="numeric">Total</TableHeaderCell>
          <TableHeaderCell intent="grow">Partner</TableHeaderCell>
        </THead>
        <TBody>
          {visibleRows.length > 0 ? (
            visibleRows.map((row) => (
              <tr key={row.tradeId} data-testid="tcdb-trade-row">
                <TableCell intent="identifier" className="font-medium">
                  <Link
                    href={`/cardattack/tcdb-trades/${row.tradeId}`}
                    className="link-blue"
                  >
                    {row.tradeId}
                  </Link>
                </TableCell>
                <TableCell intent="status">
                  <Badge className={getTradeStatusBadgeClass(row.status)}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell intent="date">
                  <time dateTime={row.startDate}>{fmtDate(row.startDate)}</time>
                </TableCell>
                <TableCell intent="date">
                  {row.endDate ? (
                    <time dateTime={row.endDate}>{fmtDate(row.endDate)}</time>
                  ) : (
                    "Open"
                  )}
                </TableCell>
                <TableCell intent="numeric">
                  {renderTradeCount(row.received)}
                </TableCell>
                <TableCell intent="numeric">
                  {renderTradeCount(row.sent)}
                </TableCell>
                <TableCell intent="numeric">
                  {renderTradeCount(row.total)}
                </TableCell>
                <TableCell intent="grow">{renderPartner(row)}</TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={8}>{emptyState}</TableEmptyRow>
          )}
        </TBody>
      </Table>
    </section>
  );
}
