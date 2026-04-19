import type { CSSProperties } from "react";
import Link from "next/link";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import type { LcsSummary } from "@/lib/lcs-types";

type LcsListClientProps = {
  rows: LcsSummary[];
  detailBasePath: string;
  shopLabel: string;
  locationLabel: string;
  siteLabel: string;
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
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--lcs-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--lcs-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lcs-ink)]/65";

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value) : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

function getLocationLabel(row: Pick<LcsSummary, "city" | "state">): string | null {
  const parts = [row.city, row.state].filter(
    (value): value is string => Boolean(value),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

export default function LcsListClient({
  rows,
  detailBasePath,
  shopLabel,
  locationLabel,
  siteLabel,
  ratingLabel,
  countLabel,
  firstCountLabel,
  latestCountLabel,
  emptyMessage,
  tableAriaLabel,
  themeStyle,
  cardTestId = "lcs-card",
  tableTestId = "lcs-table",
  rowTestId = "lcs-row",
}: LcsListClientProps) {
  return (
    <div style={themeStyle}>
      <ul className="space-y-4 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => {
            const location = getLocationLabel(row);

            return (
              <Card
                as="li"
                key={`mobile-${row.slug}`}
                className="overflow-hidden rounded-[24px] border-2 border-[color:var(--lcs-border)] bg-[color:var(--lcs-surface)] p-0 shadow-sm"
                data-testid={cardTestId}
              >
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className={mobileMetaLabelClassName}>{shopLabel}</p>
                      <Link
                        href={`${detailBasePath}/${row.slug}`}
                        className="block text-lg font-semibold leading-tight text-[color:var(--lcs-link)] transition hover:text-[color:var(--lcs-link-hover)]"
                      >
                        {row.name}
                      </Link>
                      {location ? (
                        <p className="text-sm text-[color:var(--lcs-ink)]/70">
                          {location}
                        </p>
                      ) : null}
                    </div>
                    <span className={ratingBadgeClassName}>
                      {formatRating(row.rating)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>{countLabel}</dt>
                      <dd className="font-semibold tabular-nums text-[color:var(--lcs-ink)]">
                        {row.visitCount}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>
                        {latestCountLabel}
                      </dt>
                      <dd className="font-semibold text-[color:var(--lcs-ink)]">
                        {formatVisitDate(row.latestVisitDate)}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {location ? (
                      <span className="rounded-full bg-[color:var(--lcs-accent-soft)] px-3 py-1 font-medium text-[color:var(--lcs-ink)]">
                        {`${locationLabel} ${location}`}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[color:var(--lcs-accent-wash)] px-3 py-1 font-medium text-[color:var(--lcs-ink)]">
                      {`${firstCountLabel} ${formatVisitDate(row.firstVisitDate)}`}
                    </span>
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[color:var(--lcs-link)] transition hover:text-[color:var(--lcs-link-hover)]"
                      >
                        {siteLabel}
                      </a>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--lcs-border)] bg-[color:var(--lcs-surface)] p-4 text-sm text-[color:var(--lcs-ink)]/80 shadow-sm"
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
          <th scope="col">{shopLabel}</th>
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
            rows.map((row) => {
              const location = getLocationLabel(row);

              return (
                <tr
                  key={row.slug}
                  className="border-b border-[color:var(--table-row-divider)] last:border-0"
                  data-testid={rowTestId}
                >
                  <td>
                    <Link
                      href={`${detailBasePath}/${row.slug}`}
                      className="text-base font-semibold text-[color:var(--lcs-link)] transition hover:text-[color:var(--lcs-link-hover)]"
                    >
                      {row.name}
                    </Link>
                    {location ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--lcs-ink)]/60">
                        {location}
                      </p>
                    ) : null}
                    {row.url ? (
                      <p className="mt-2 text-xs font-medium text-[color:var(--lcs-link)]">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition hover:text-[color:var(--lcs-link-hover)]"
                        >
                          {siteLabel.toLowerCase()}
                        </a>
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={ratingBadgeClassName}>
                      {formatRating(row.rating)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap font-semibold tabular-nums text-[color:var(--lcs-ink)]">
                    {row.visitCount}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-[color:var(--lcs-ink)]">
                    {formatVisitDate(row.firstVisitDate)}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-[color:var(--lcs-ink)]">
                    {formatVisitDate(row.latestVisitDate)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="text-sm text-[color:var(--lcs-ink)]/80">
                {emptyMessage}
              </td>
            </tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
