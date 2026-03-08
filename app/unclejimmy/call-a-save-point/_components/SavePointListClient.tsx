"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import type { SavePointSummary } from "@/lib/save-point";

type Props = {
  rows: SavePointSummary[];
};

export default function SavePointListClient({ rows }: Props) {
  const sortedRows = rows;

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.savePointId}`}
              className="p-3"
              data-testid="save-point-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    Video Game
                  </p>
                  <Link
                    href={
                      `/unclejimmy/call-a-save-point/${row.savePointId}` as Route
                    }
                    className="link-blue text-sm font-medium"
                  >
                    {row.savePointName}
                  </Link>
                </div>
                <Badge className={getBadgeClass("spike")}>
                  {`${row.averageRating.toFixed(1)}/10`}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Reviews
                  </dt>
                  <dd className="tabular-nums">{row.visitCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Last Review
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
                  Save Point ID
                </p>
                <p className="tabular-nums">{row.savePointId}</p>
              </div>
              {row.savePointUrl ? (
                <div className="mt-2 text-sm">
                  <a
                    href={row.savePointUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-blue"
                  >
                    Visit game site
                  </a>
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No save point reviews have been referenced in chronicles yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Save point reviews table"
        data-testid="save-point-table"
      >
        <THead variant="bucks">
          <th scope="col">Game</th>
          <th scope="col" className="w-[140px] whitespace-nowrap">
            Avg Rating
          </th>
          <th scope="col" className="w-[90px] whitespace-nowrap">
            Reviews
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            Last Review
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.savePointId}
                className="border-b border-black/5 last:border-0"
                data-testid="save-point-row"
              >
                <td>
                  <Link
                    href={
                      `/unclejimmy/call-a-save-point/${row.savePointId}` as Route
                    }
                    className="link-blue"
                  >
                    {row.savePointName}
                  </Link>
                  <p className="mt-1 text-xs text-ink/60">
                    {`Save Point ID ${row.savePointId}`}
                  </p>
                  {row.savePointUrl ? (
                    <p className="mt-1 text-xs text-ink/60">
                      <a
                        href={row.savePointUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-blue"
                      >
                        game site
                      </a>
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap font-medium tabular-nums">
                  {`${row.averageRating.toFixed(1)}/10`}
                </td>
                <td className="whitespace-nowrap tabular-nums">
                  {row.visitCount}
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
                No save point reviews have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
