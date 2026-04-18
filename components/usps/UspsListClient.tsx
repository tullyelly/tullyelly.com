import type { CSSProperties } from "react";
import Link from "next/link";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";

type UspsListRow = {
  citySlug: string;
  cityName: string;
  state: string;
  rating: number;
  visitCount: number;
  firstVisitDate?: string;
  latestVisitDate?: string;
};

type UspsListClientProps = {
  rows: UspsListRow[];
  detailBasePath: string;
  locationLabel: string;
  stateLabel: string;
  ratingLabel: string;
  countLabel: string;
  firstCountLabel: string;
  latestCountLabel: string;
  emptyMessage: string;
  tableAriaLabel: string;
  themeStyle?: CSSProperties;
  cardTestId?: string;
  tableTestId?: string;
  rowTestId?: string;
};

const ratingBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--usps-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--usps-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--usps-ink)]/65";

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value) : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

export default function UspsListClient({
  rows,
  detailBasePath,
  locationLabel,
  stateLabel,
  ratingLabel,
  countLabel,
  firstCountLabel,
  latestCountLabel,
  emptyMessage,
  tableAriaLabel,
  themeStyle,
  cardTestId = "usps-card",
  tableTestId = "usps-table",
  rowTestId = "usps-row",
}: UspsListClientProps) {
  return (
    <div style={themeStyle}>
      <ul className="space-y-4 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Card
              as="li"
              key={`mobile-${row.citySlug}`}
              className="overflow-hidden rounded-[24px] border-2 border-[color:var(--usps-border)] bg-[color:var(--usps-surface)] p-0 shadow-sm"
              data-testid={cardTestId}
            >
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className={mobileMetaLabelClassName}>{locationLabel}</p>
                    <Link
                      href={`${detailBasePath}/${row.citySlug}`}
                      className="block text-lg font-semibold leading-tight text-[color:var(--usps-link)] transition hover:text-[color:var(--usps-link-hover)]"
                    >
                      {row.cityName}
                    </Link>
                    <p className="text-sm text-[color:var(--usps-ink)]/70">
                      {row.state}
                    </p>
                  </div>
                  <span className={ratingBadgeClassName}>
                    {formatRating(row.rating)}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>{countLabel}</dt>
                    <dd className="font-semibold tabular-nums text-[color:var(--usps-ink)]">
                      {row.visitCount}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className={mobileMetaLabelClassName}>
                      {latestCountLabel}
                    </dt>
                    <dd className="font-semibold text-[color:var(--usps-ink)]">
                      {formatVisitDate(row.latestVisitDate)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-[color:var(--usps-accent-soft)] px-3 py-1 font-medium text-[color:var(--usps-ink)]">
                    {`${stateLabel} ${row.state}`}
                  </span>
                  <span className="rounded-full bg-[color:var(--usps-accent-wash)] px-3 py-1 font-medium text-[color:var(--usps-ink)]">
                    {`${firstCountLabel} ${formatVisitDate(row.firstVisitDate)}`}
                  </span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--usps-border)] bg-[color:var(--usps-surface)] p-4 text-sm text-[color:var(--usps-ink)]/80 shadow-sm"
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
          <th scope="col">{locationLabel}</th>
          <th scope="col" className="w-[132px] whitespace-nowrap">
            {ratingLabel}
          </th>
          <th scope="col" className="w-[90px] whitespace-nowrap">
            {countLabel}
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            {firstCountLabel}
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            {latestCountLabel}
          </th>
        </THead>
        <TBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr
                key={row.citySlug}
                className="border-b border-[color:var(--table-row-divider)] last:border-0"
                data-testid={rowTestId}
              >
                <td>
                  <Link
                    href={`${detailBasePath}/${row.citySlug}`}
                    className="text-base font-semibold text-[color:var(--usps-link)] transition hover:text-[color:var(--usps-link-hover)]"
                  >
                    {row.cityName}
                  </Link>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--usps-ink)]/60">
                    {row.state}
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  <span className={ratingBadgeClassName}>
                    {formatRating(row.rating)}
                  </span>
                </td>
                <td className="whitespace-nowrap font-semibold tabular-nums text-[color:var(--usps-ink)]">
                  {row.visitCount}
                </td>
                <td className="whitespace-nowrap font-semibold text-[color:var(--usps-ink)]">
                  {formatVisitDate(row.firstVisitDate)}
                </td>
                <td className="whitespace-nowrap font-semibold text-[color:var(--usps-ink)]">
                  {formatVisitDate(row.latestVisitDate)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="text-sm text-[color:var(--usps-ink)]/80"
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
