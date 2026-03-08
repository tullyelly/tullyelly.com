"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import type { TableSchemaSummary } from "@/lib/table-schema";

type Props = {
  rows: TableSchemaSummary[];
};

export default function TableSchemaListClient({ rows }: Props) {
  const sortedRows = rows;

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.tableSchemaId}`}
              className="p-3"
              data-testid="table-schema-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    Restaurant
                  </p>
                  <Link
                    href={`/unclejimmy/table-schema/${row.tableSchemaId}` as Route}
                    className="link-blue text-sm font-medium"
                  >
                    {row.tableSchemaName}
                  </Link>
                </div>
                <Badge className={getBadgeClass("spike")}>
                  {`${row.averageRating.toFixed(1)}/10`}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Visits
                  </dt>
                  <dd className="tabular-nums">{row.visitCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink/60">
                    Last Visit
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
                  Table Schema ID
                </p>
                <p className="tabular-nums">{row.tableSchemaId}</p>
              </div>
              {row.tableSchemaUrl ? (
                <div className="mt-2 text-sm">
                  <a
                    href={row.tableSchemaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-blue"
                  >
                    Visit restaurant site
                  </a>
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No table schema reviews have been referenced in chronicles yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Table schema restaurants table"
        data-testid="table-schema-table"
      >
        <THead variant="bucks">
          <th scope="col">Establishment</th>
          <th scope="col" className="w-[140px] whitespace-nowrap">
            Avg Rating
          </th>
          <th scope="col" className="w-[90px] whitespace-nowrap">
            Visits
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            Last Visit
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.tableSchemaId}
                className="border-b border-black/5 last:border-0"
                data-testid="table-schema-row"
              >
                <td>
                  <Link
                    href={`/unclejimmy/table-schema/${row.tableSchemaId}` as Route}
                    className="link-blue"
                  >
                    {row.tableSchemaName}
                  </Link>
                  <p className="mt-1 text-xs text-ink/60">
                    {`Table Schema ID ${row.tableSchemaId}`}
                  </p>
                  {row.tableSchemaUrl ? (
                    <p className="mt-1 text-xs text-ink/60">
                      <a
                        href={row.tableSchemaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-blue"
                      >
                        restaurant site
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
                No table schema reviews have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
