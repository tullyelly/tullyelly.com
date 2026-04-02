import type { CSSProperties } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";

type ReviewListRow = {
  id: string;
  name: string;
  url?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

type ReviewListClientProps = {
  rows: ReviewListRow[];
  detailBasePath: string;
  subjectLabel: string;
  subjectIdLabel: string;
  countLabel: string;
  lastCountLabel: string;
  externalLinkLabel: string;
  emptyMessage: string;
  tableAriaLabel: string;
  tableFirstColumnLabel: string;
  tableExternalLinkLabel?: string;
  themeStyle?: CSSProperties;
  cardTestId?: string;
  tableTestId?: string;
  rowTestId?: string;
};

const ratingBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--review-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--review-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--review-ink)]/65";

export default function ReviewListClient({
  rows,
  detailBasePath,
  subjectLabel,
  subjectIdLabel,
  countLabel,
  lastCountLabel,
  externalLinkLabel,
  emptyMessage,
  tableAriaLabel,
  tableFirstColumnLabel,
  tableExternalLinkLabel = externalLinkLabel.toLowerCase(),
  themeStyle,
  cardTestId = "review-card",
  tableTestId = "review-table",
  rowTestId = "review-row",
}: ReviewListClientProps) {
  const sortedRows = rows;

  return (
    <div style={themeStyle}>
      <ul className="space-y-4 md:hidden">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.id}`}
              className="overflow-hidden rounded-[24px] border-2 border-[color:var(--review-border)] bg-[color:var(--review-surface)] p-0 shadow-sm"
              data-testid={cardTestId}
            >
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className={mobileMetaLabelClassName}>{subjectLabel}</p>
                    <Link
                      href={`${detailBasePath}/${row.id}` as Route}
                      className="block text-lg font-semibold leading-tight text-[color:var(--review-link)] transition hover:text-[color:var(--review-link-hover)]"
                    >
                      {row.name}
                    </Link>
                  </div>
                  <span className={ratingBadgeClassName}>
                    {`${row.averageRating.toFixed(1)}/10`}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>{countLabel}</dt>
                    <dd className="font-semibold tabular-nums text-[color:var(--review-ink)]">
                      {row.visitCount}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>{lastCountLabel}</dt>
                    <dd className="font-semibold text-[color:var(--review-ink)]">
                      <time dateTime={row.latestPostDate}>
                        {fmtDate(row.latestPostDate)}
                      </time>
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-[color:var(--review-accent-soft)] px-3 py-1 font-medium text-[color:var(--review-ink)]">
                    {`${subjectIdLabel} ${row.id}`}
                  </span>
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[color:var(--review-link)] transition hover:text-[color:var(--review-link-hover)]"
                    >
                      {externalLinkLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--review-border)] bg-[color:var(--review-surface)] p-4 text-sm text-[color:var(--review-ink)]/80 shadow-sm"
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
          <th scope="col">{tableFirstColumnLabel}</th>
          <th scope="col" className="w-[140px] whitespace-nowrap">
            Avg Rating
          </th>
          <th scope="col" className="w-[90px] whitespace-nowrap">
            {countLabel}
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            {lastCountLabel}
          </th>
        </THead>
        <TBody>
          {sortedRows.length > 0 ? (
            sortedRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[color:var(--table-row-divider)] last:border-0"
                data-testid={rowTestId}
              >
                <td>
                  <Link
                    href={`${detailBasePath}/${row.id}` as Route}
                    className="text-base font-semibold text-[color:var(--review-link)] transition hover:text-[color:var(--review-link-hover)]"
                  >
                    {row.name}
                  </Link>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--review-ink)]/60">
                    {`${subjectIdLabel} ${row.id}`}
                  </p>
                  {row.url ? (
                    <p className="mt-2 text-xs font-medium text-[color:var(--review-link)]">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-[color:var(--review-link-hover)]"
                      >
                        {tableExternalLinkLabel}
                      </a>
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap">
                  <span className={ratingBadgeClassName}>
                    {`${row.averageRating.toFixed(1)}/10`}
                  </span>
                </td>
                <td className="whitespace-nowrap font-semibold tabular-nums text-[color:var(--review-ink)]">
                  {row.visitCount}
                </td>
                <td className="whitespace-nowrap font-semibold text-[color:var(--review-ink)]">
                  <time dateTime={row.latestPostDate}>
                    {fmtDate(row.latestPostDate)}
                  </time>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-sm text-[color:var(--review-ink)]/80">
                {emptyMessage}
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
