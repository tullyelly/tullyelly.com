"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import type { LcsSummary } from "@/lib/lcs";

type Props = {
  rows: LcsSummary[];
};

export default function LcsListClient({ rows }: Props) {
  const sortedRows = rows;

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.lcsId}`}
              className="p-3"
              data-testid="lcs-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    Card Shop
                  </p>
                  <Link
                    href={`/cardattack/lcs/${row.lcsId}` as Route}
                    className="link-blue text-sm font-medium"
                  >
                    {row.lcsName}
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
                  Shop ID
                </p>
                <p className="tabular-nums">{row.lcsId}</p>
              </div>
              {row.lcsUrl ? (
                <div className="mt-2 text-sm">
                  <a
                    href={row.lcsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-blue"
                  >
                    Visit shop site
                  </a>
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <Card as="li" className="p-3 text-sm text-ink/70">
            No local card shop reviews have been referenced in chronicles yet.
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label="Local card shops table"
        data-testid="lcs-table"
      >
        <THead variant="bucks">
          <th scope="col">Card Shop</th>
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
                key={row.lcsId}
                className="border-b border-black/5 last:border-0"
                data-testid="lcs-row"
              >
                <td>
                  <Link
                    href={`/cardattack/lcs/${row.lcsId}` as Route}
                    className="link-blue"
                  >
                    {row.lcsName}
                  </Link>
                  <p className="mt-1 text-xs text-ink/60">{`Shop ID ${row.lcsId}`}</p>
                  {row.lcsUrl ? (
                    <p className="mt-1 text-xs text-ink/60">
                      <a
                        href={row.lcsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-blue"
                      >
                        shop site
                      </a>
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap font-medium tabular-nums">
                  {`${row.averageRating.toFixed(1)}/10`}
                </td>
                <td className="whitespace-nowrap tabular-nums">{row.visitCount}</td>
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
                No local card shop reviews have been referenced in chronicles yet.
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </>
  );
}
