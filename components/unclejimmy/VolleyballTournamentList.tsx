"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import {
  MobileDataCard,
  MobileDataEmptyState,
  MobileDataField,
  MobileDataGrid,
  MobileDataCardHeader,
} from "@/components/ui/MobileDataCard";
import TableSearch, { useTableSearch } from "@/components/ui/TableSearch";
import {
  Table,
  TableCell,
  TableEmptyRow,
  TableHeaderCell,
  TBody,
  THead,
} from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { formatVolleyballTournamentFinish } from "@/lib/volleyball-finish";
import type { VolleyballTournamentListSummary } from "@/lib/volleyball-tournament-db";

type Props = {
  rows: VolleyballTournamentListSummary[];
};

const getFinishLabel = (finish: number | null) =>
  formatVolleyballTournamentFinish(finish) ?? "Not tracked";

export default function VolleyballTournamentList({ rows }: Props) {
  const [query, setQuery] = useState("");
  const filteredRows = useTableSearch(rows, query, (row) => [
    row.tournamentName,
    row.tournamentId,
    row.overallRecord,
    getFinishLabel(row.finish),
  ]);

  return (
    <div className="space-y-4">
      <DataToolbar
        search={
          <TableSearch
            query={query}
            onQueryChange={setQuery}
            placeholder="Search tournaments"
            label="Search volleyball tournaments"
          />
        }
        result={
          <DataResultCount>
            {`${filteredRows.length} ${filteredRows.length === 1 ? "tournament" : "tournaments"}`}
          </DataResultCount>
        }
      />
      <ul className="space-y-3 md:hidden">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => (
            <MobileDataCard
              key={`mobile-${row.tournamentId}`}
              data-testid="volleyball-tournament-card"
            >
              <MobileDataCardHeader
                eyebrow="Tournament"
                title={
                  <Link
                    href={
                      `/unclejimmy/squad/volleyball/${row.tournamentId}` as Route
                    }
                    className="link-blue text-sm font-medium"
                  >
                    {row.tournamentName}
                  </Link>
                }
                trailing={
                  <Badge className={getBadgeClass("spike")}>
                    {row.overallRecord}
                  </Badge>
                }
              />
              <MobileDataGrid>
                <MobileDataField label="Finish">
                  {getFinishLabel(row.finish)}
                </MobileDataField>
                <MobileDataField label="Days" valueClassName="tabular-nums">
                  {row.tournamentDays}
                </MobileDataField>
                <MobileDataField label="Date">
                  <time dateTime={row.latestTournamentDate}>
                    {fmtDate(row.latestTournamentDate)}
                  </time>
                </MobileDataField>
                <MobileDataField
                  label="Tournament ID"
                  valueClassName="tabular-nums"
                >
                  {row.tournamentId}
                </MobileDataField>
              </MobileDataGrid>
            </MobileDataCard>
          ))
        ) : (
          <MobileDataEmptyState>
            {query
              ? "No tournaments match your search."
              : "No volleyball tournaments have been recorded yet."}
          </MobileDataEmptyState>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Volleyball tournaments table"
        data-testid="volleyball-tournament-table"
      >
        <THead variant="bucks">
          <TableHeaderCell intent="name">Tournament</TableHeaderCell>
          <TableHeaderCell intent="status">Finish</TableHeaderCell>
          <TableHeaderCell intent="status">Record</TableHeaderCell>
          <TableHeaderCell intent="numeric">Days</TableHeaderCell>
          <TableHeaderCell intent="date">Date</TableHeaderCell>
        </THead>
        <TBody>
          {filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <tr
                key={row.tournamentId}
                data-testid="volleyball-tournament-row"
              >
                <TableCell intent="name">
                  <Link
                    href={
                      `/unclejimmy/squad/volleyball/${row.tournamentId}` as Route
                    }
                    className="link-blue"
                  >
                    {row.tournamentName}
                  </Link>
                  <p className="mt-1 text-xs text-ink/60">
                    {`Tournament ID ${row.tournamentId}`}
                  </p>
                </TableCell>
                <TableCell intent="status" className="font-medium">
                  {getFinishLabel(row.finish)}
                </TableCell>
                <TableCell intent="status" className="font-medium tabular-nums">
                  {row.overallRecord}
                </TableCell>
                <TableCell intent="numeric">{row.tournamentDays}</TableCell>
                <TableCell intent="date">
                  <time dateTime={row.latestTournamentDate}>
                    {fmtDate(row.latestTournamentDate)}
                  </time>
                </TableCell>
              </tr>
            ))
          ) : (
            <TableEmptyRow colSpan={5}>
              {query
                ? "No tournaments match your search."
                : "No volleyball tournaments have been recorded yet."}
            </TableEmptyRow>
          )}
        </TBody>
      </Table>
    </div>
  );
}
