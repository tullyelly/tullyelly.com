"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import type { VolleyballTournamentSummary } from "@/lib/volleyball-tournaments";

type Props = {
  rows: VolleyballTournamentSummary[];
};

export default function VolleyballTournamentListClient({ rows }: Props) {
  const sortedRows = rows;

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.tournamentId}`}
              className="p-3"
              data-testid="volleyball-tournament-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    Tournament
                  </p>
                  <Link
                    href={
                      `/unclejimmy/squad/volleyball/${row.tournamentId}` as Route
                    }
                    className="link-blue text-sm font-medium"
                  >
                    {row.tournamentName}
                  </Link>
                </div>
                <Badge className={getBadgeClass("spike")}>
                  {row.overallRecord}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Days
                  </dt>
                  <dd className="tabular-nums">{row.tournamentDays}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Latest Day
                  </dt>
                  <dd>
                    <time dateTime={row.latestPostDate}>
                      {fmtDate(row.latestPostDate)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div className="mt-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-ink/60">
                  Tournament ID
                </p>
                <p className="tabular-nums">{row.tournamentId}</p>
              </div>
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No volleyball tournaments have been referenced in chronicles yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Volleyball tournaments table"
        data-testid="volleyball-tournament-table"
      >
        <THead variant="bucks">
          <th scope="col">Tournament</th>
          <th scope="col" className="w-[130px] whitespace-nowrap">
            Record
          </th>
          <th scope="col" className="w-[90px] whitespace-nowrap">
            Days
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            Latest Day
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.tournamentId}
                className="border-b border-black/5 last:border-0"
                data-testid="volleyball-tournament-row"
              >
                <td>
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
                </td>
                <td className="whitespace-nowrap font-medium tabular-nums">
                  {row.overallRecord}
                </td>
                <td className="whitespace-nowrap tabular-nums">
                  {row.tournamentDays}
                </td>
                <td className="whitespace-nowrap">
                  <time dateTime={row.latestPostDate}>
                    {fmtDate(row.latestPostDate)}
                  </time>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-sm text-ink/70">
                No volleyball tournaments have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
