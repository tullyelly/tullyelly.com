import type { CSSProperties } from "react";
import Link from "next/link";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import { formatBricksReviewScore } from "@/lib/bricks-types";

type BricksListRow = {
  publicId: string;
  setName: string;
  tag?: string;
  pieceCount?: number;
  reviewScore: number;
  sessionCount: number;
  latestBuildDate?: string;
};

type BricksListClientProps = {
  rows: BricksListRow[];
  detailBasePath: string;
  emptyMessage: string;
  tableAriaLabel: string;
  themeStyle?: CSSProperties;
  cardTestId?: string;
  tableTestId?: string;
  rowTestId?: string;
};

const scoreBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--bricks-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--bricks-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--bricks-ink)]/65";

function formatBuildDate(value?: string): string {
  return value ? fmtDate(value) : "Not available";
}

export default function BricksListClient({
  rows,
  detailBasePath,
  emptyMessage,
  tableAriaLabel,
  themeStyle,
  cardTestId = "bricks-card",
  tableTestId = "bricks-table",
  rowTestId = "bricks-row",
}: BricksListClientProps) {
  return (
    <div style={themeStyle}>
      <ul className="space-y-4 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.publicId}`}
              className="overflow-hidden rounded-[24px] border-2 border-[color:var(--bricks-border)] bg-[color:var(--bricks-surface)] p-0 shadow-sm"
              data-testid={cardTestId}
            >
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className={mobileMetaLabelClassName}>Set</p>
                    <Link
                      href={`${detailBasePath}/${row.publicId}`}
                      className="block text-lg font-semibold leading-tight text-[color:var(--bricks-link)] transition hover:text-[color:var(--bricks-link-hover)]"
                    >
                      {row.setName}
                    </Link>
                  </div>
                  <span className={scoreBadgeClassName}>
                    {formatBricksReviewScore(row.reviewScore)}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>Sessions</dt>
                    <dd className="font-semibold tabular-nums text-[color:var(--bricks-ink)]">
                      {row.sessionCount}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>Last Session</dt>
                    <dd className="font-semibold text-[color:var(--bricks-ink)]">
                      {formatBuildDate(row.latestBuildDate)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-[color:var(--bricks-accent-soft)] px-3 py-1 font-medium text-[color:var(--bricks-ink)]">
                    {`LEGO ID ${row.publicId}`}
                  </span>
                  {row.tag ? (
                    <span className="rounded-full bg-[color:var(--bricks-accent-wash)] px-3 py-1 font-medium text-[color:var(--bricks-ink)]">
                      {`Tag ${row.tag}`}
                    </span>
                  ) : null}
                  {row.pieceCount !== undefined ? (
                    <span className="rounded-full bg-[color:var(--bricks-accent-wash)] px-3 py-1 font-medium text-[color:var(--bricks-ink)]">
                      {`${row.pieceCount} pieces`}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--bricks-border)] bg-[color:var(--bricks-surface)] p-4 text-sm text-[color:var(--bricks-ink)]/80 shadow-sm"
          >
            {emptyMessage}
          </Card>
        )}
      </ul>

      <Table
        variant="bucks"
        aria-label={tableAriaLabel}
        data-testid={tableTestId}
        themeStyle={themeStyle}
      >
        <THead variant="bucks">
          <th scope="col">Set</th>
          <th scope="col" className="w-[150px] whitespace-nowrap">
            Overall Score
          </th>
          <th scope="col" className="w-[96px] whitespace-nowrap">
            Sessions
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            Last Session
          </th>
        </THead>
        <TBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr
                key={row.publicId}
                className="border-b border-[color:var(--table-row-divider)] last:border-0"
                data-testid={rowTestId}
              >
                <td>
                  <Link
                    href={`${detailBasePath}/${row.publicId}`}
                    className="text-base font-semibold text-[color:var(--bricks-link)] transition hover:text-[color:var(--bricks-link-hover)]"
                  >
                    {row.setName}
                  </Link>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--bricks-ink)]/60">
                    {`LEGO ID ${row.publicId}`}
                  </p>
                  {(row.tag || row.pieceCount !== undefined) && (
                    <p className="mt-2 text-xs font-medium text-[color:var(--bricks-ink)]/70">
                      {[
                        row.tag ? `Tag ${row.tag}` : null,
                        row.pieceCount !== undefined
                          ? `${row.pieceCount} pieces`
                          : null,
                      ]
                        .filter((part): part is string => Boolean(part))
                        .join("; ")}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap">
                  <span className={scoreBadgeClassName}>
                    {formatBricksReviewScore(row.reviewScore)}
                  </span>
                </td>
                <td className="whitespace-nowrap font-semibold tabular-nums text-[color:var(--bricks-ink)]">
                  {row.sessionCount}
                </td>
                <td className="whitespace-nowrap font-semibold text-[color:var(--bricks-ink)]">
                  {formatBuildDate(row.latestBuildDate)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="text-sm text-[color:var(--bricks-ink)]/80"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
