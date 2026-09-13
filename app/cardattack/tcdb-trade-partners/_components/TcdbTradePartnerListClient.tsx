"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import { fmtDate } from "@/lib/datetime";
import type { TcdbTradePartnerSummary } from "@/lib/tcdb-trade-partners-db";

type PartnerSort = "latest" | "username" | "trades" | "cards";

const integer = new Intl.NumberFormat("en-US");
const getPartnerSearchValues = (partner: TcdbTradePartnerSummary) => [
  partner.tcdbUsername,
  partner.name,
  partner.cityState,
  partner.country,
];

function partnerLocation(partner: TcdbTradePartnerSummary) {
  return (
    [partner.cityState, partner.country].filter(Boolean).join("; ") ||
    "Not listed"
  );
}

export default function TcdbTradePartnerListClient({
  rows,
}: {
  rows: TcdbTradePartnerSummary[];
}) {
  const [query, setQuery] = useState("");
  const [recognition, setRecognition] = useState("");
  const [sort, setSort] = useState<PartnerSort>("latest");
  const searchedRows = useTableSearch(rows, query, getPartnerSearchValues);
  const visibleRows = useMemo(() => {
    const filtered = searchedRows.filter(
      (row) => recognition !== "hall-of-fame" || row.hallOfFameCount > 0,
    );

    if (sort === "latest") return filtered;

    return [...filtered].sort((a, b) => {
      if (sort === "username") {
        return a.tcdbUsername.localeCompare(b.tcdbUsername);
      }
      if (sort === "trades") return b.tradeCount - a.tradeCount;
      return b.totalCardsExchanged - a.totalCardsExchanged;
    });
  }, [recognition, searchedRows, sort]);
  const hasActiveControls =
    query.length > 0 || recognition.length > 0 || sort !== "latest";
  const emptyState =
    rows.length === 0
      ? "No trade partners are available yet."
      : "No trade partners match these filters.";

  function clearControls() {
    setQuery("");
    setRecognition("");
    setSort("latest");
  }

  return (
    <div id="trade-partner-data-view" className="space-y-4">
      <DataToolbar
        ariaLabel="Trade partner controls"
        search={
          <TableSearch
            query={query}
            onQueryChange={setQuery}
            label="Search trade partners"
            ariaControls="trade-partner-data-view"
          />
        }
        filters={
          <>
            <select
              className="form-input w-full sm:w-auto"
              aria-label="Filter trade partners by recognition"
              value={recognition}
              onChange={(event) => setRecognition(event.target.value)}
            >
              <option value="">All partners</option>
              <option value="hall-of-fame">Hall of Fame</option>
            </select>
            <select
              className="form-input w-full sm:w-auto"
              aria-label="Sort trade partners"
              value={sort}
              onChange={(event) => setSort(event.target.value as PartnerSort)}
            >
              <option value="latest">Latest trade</option>
              <option value="username">Username</option>
              <option value="trades">Most trades</option>
              <option value="cards">Most cards</option>
            </select>
          </>
        }
        actions={
          hasActiveControls ? (
            <button type="button" className="btn" onClick={clearControls}>
              Clear filters
            </button>
          ) : null
        }
        result={
          <DataResultCount>
            {visibleRows.length} trade partner
            {visibleRows.length === 1 ? "" : "s"}
          </DataResultCount>
        }
      />

      <ul className="space-y-3 md:hidden">
        {visibleRows.length > 0 ? (
          visibleRows.map((partner) => (
            <MobileDataCard key={partner.id}>
              <MobileDataCardHeader
                eyebrow="TCDb partner"
                title={
                  <Link
                    className="link-blue"
                    href={`/cardattack/tcdb-trade-partners/${partner.id}`}
                  >
                    {partner.tcdbUsername}
                  </Link>
                }
                description={partner.name || "Name not listed"}
                trailing={
                  partner.hallOfFameCount > 0 ? (
                    <span className="rounded-full bg-[color:var(--green)] px-2.5 py-1 text-xs font-semibold text-white">
                      Hall of Fame
                    </span>
                  ) : null
                }
              />
              <MobileDataGrid>
                <MobileDataField label="Location">
                  {partnerLocation(partner)}
                </MobileDataField>
                <MobileDataField label="Trades" valueClassName="tabular-nums">
                  {integer.format(partner.tradeCount)}
                </MobileDataField>
                <MobileDataField label="Cards" valueClassName="tabular-nums">
                  {integer.format(partner.totalCardsExchanged)}
                </MobileDataField>
                <MobileDataField
                  label="Sent / received"
                  valueClassName="tabular-nums"
                >
                  {integer.format(partner.cardsSent)} /{" "}
                  {integer.format(partner.cardsReceived)}
                </MobileDataField>
                <MobileDataField label="Latest trade" className="col-span-2">
                  {partner.latestTradeDate ? (
                    <time dateTime={partner.latestTradeDate}>
                      {fmtDate(partner.latestTradeDate)}
                    </time>
                  ) : (
                    "Not available"
                  )}
                </MobileDataField>
              </MobileDataGrid>
            </MobileDataCard>
          ))
        ) : (
          <MobileDataEmptyState>{emptyState}</MobileDataEmptyState>
        )}
      </ul>

      <Table variant="bucks" aria-label="TCDb trade partners">
        <THead variant="bucks">
          <TableHeaderCell intent="name">Partner</TableHeaderCell>
          <TableHeaderCell intent="descriptive">
            Name and location
          </TableHeaderCell>
          <TableHeaderCell intent="numeric">Trades</TableHeaderCell>
          <TableHeaderCell intent="numeric">Sent</TableHeaderCell>
          <TableHeaderCell intent="numeric">Received</TableHeaderCell>
          <TableHeaderCell intent="numeric">Total</TableHeaderCell>
          <TableHeaderCell intent="date">Latest trade</TableHeaderCell>
          <TableHeaderCell intent="status">Hall of Fame</TableHeaderCell>
        </THead>
        <TBody>
          {visibleRows.length > 0 ? (
            visibleRows.map((partner) => (
              <tr key={partner.id}>
                <TableCell intent="name">
                  <Link
                    className="link-blue font-medium"
                    href={`/cardattack/tcdb-trade-partners/${partner.id}`}
                  >
                    {partner.tcdbUsername}
                  </Link>
                </TableCell>
                <TableCell intent="descriptive">
                  <div>{partner.name || "Name not listed"}</div>
                  <div className="text-xs text-muted-foreground">
                    {partnerLocation(partner)}
                  </div>
                </TableCell>
                <TableCell intent="numeric">
                  {integer.format(partner.tradeCount)}
                </TableCell>
                <TableCell intent="numeric">
                  {integer.format(partner.cardsSent)}
                </TableCell>
                <TableCell intent="numeric">
                  {integer.format(partner.cardsReceived)}
                </TableCell>
                <TableCell intent="numeric">
                  {integer.format(partner.totalCardsExchanged)}
                </TableCell>
                <TableCell intent="date">
                  {partner.latestTradeDate ? (
                    <time dateTime={partner.latestTradeDate}>
                      {fmtDate(partner.latestTradeDate)}
                    </time>
                  ) : (
                    "Not available"
                  )}
                </TableCell>
                <TableCell intent="status">
                  {partner.hallOfFameCount
                    ? integer.format(partner.hallOfFameCount)
                    : "-"}
                </TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={8}>{emptyState}</TableEmptyRow>
          )}
        </TBody>
      </Table>
    </div>
  );
}
