import type { CSSProperties } from "react";
import Link from "next/link";
import { Card } from "@ui";

import { Table, TBody, THead } from "@/components/ui/Table";
import { fmtDate } from "@/lib/datetime";
import {
  formatSetCollectorPercentComplete,
  formatSetCollectorRating,
} from "@/lib/set-collector-types";

type SetCollectorListRow = {
  id: number;
  setName: string;
  releaseYear: number;
  manufacturer: string;
  totalCards: number;
  snapshotCount: number;
  categoryTag?: string;
  rating?: number;
  cardsOwned?: number;
  percentComplete?: number;
  latestSnapshotDate?: string;
};

type SetCollectorListClientProps = {
  rows: SetCollectorListRow[];
  detailBasePath: string;
  emptyMessage: string;
  tableAriaLabel: string;
  themeStyle?: CSSProperties;
  cardTestId?: string;
  tableTestId?: string;
  rowTestId?: string;
};

const ratingBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--collector-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--collector-pill-fg)] shadow-sm";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--collector-ink)]/65";

function formatSnapshotDate(value?: string): string {
  return value ? fmtDate(value) : "Not available";
}

function formatRatingLabel(value?: number): string {
  return value === undefined ? "Not rated" : formatSetCollectorRating(value);
}

function formatLatestProgress(
  cardsOwned?: number,
  totalCards?: number,
  percentComplete?: number,
): { counts: string; percent: string } {
  if (totalCards === undefined) {
    return {
      counts: "Not available",
      percent: "Not available",
    };
  }

  if (cardsOwned === undefined || percentComplete === undefined) {
    return {
      counts: "Not available",
      percent: "No snapshot yet",
    };
  }

  return {
    counts: `${cardsOwned} / ${totalCards}`,
    percent: `${formatSetCollectorPercentComplete(percentComplete)} complete`,
  };
}

export default function SetCollectorListClient({
  rows,
  detailBasePath,
  emptyMessage,
  tableAriaLabel,
  themeStyle,
  cardTestId = "set-collector-card",
  tableTestId = "set-collector-table",
  rowTestId = "set-collector-row",
}: SetCollectorListClientProps) {
  return (
    <div style={themeStyle}>
      <ul className="space-y-4 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => {
            const progress = formatLatestProgress(
              row.cardsOwned,
              row.totalCards,
              row.percentComplete,
            );

            return (
              <Card
                as="li"
                key={`mobile-${row.id}`}
                className="overflow-hidden rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-0 shadow-sm"
                data-testid={cardTestId}
              >
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className={mobileMetaLabelClassName}>Tracked Set</p>
                      <Link
                        href={`${detailBasePath}/${row.id}`}
                        className="block text-lg font-semibold leading-tight text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                      >
                        {row.setName}
                      </Link>
                    </div>
                    <span className={ratingBadgeClassName}>
                      {formatRatingLabel(row.rating)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Release Year</dt>
                      <dd className="font-semibold tabular-nums text-[color:var(--collector-ink)]">
                        {row.releaseYear}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>
                        Latest Snapshot
                      </dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {formatSnapshotDate(row.latestSnapshotDate)}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Manufacturer</dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {row.manufacturer}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className={mobileMetaLabelClassName}>Progress</dt>
                      <dd className="font-semibold text-[color:var(--collector-ink)]">
                        {progress.counts}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {row.categoryTag ? (
                      <span className="rounded-full bg-[color:var(--collector-accent-soft)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                        {row.categoryTag}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[color:var(--collector-accent-wash)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                      {progress.percent}
                    </span>
                    <span className="rounded-full bg-[color:var(--collector-accent-wash)] px-3 py-1 font-medium text-[color:var(--collector-ink)]">
                      {`${row.snapshotCount} ${row.snapshotCount === 1 ? "snapshot" : "snapshots"}`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card
            as="li"
            className="rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-4 text-sm text-[color:var(--collector-ink)]/80 shadow-sm"
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
          <th scope="col" className="w-[92px] whitespace-nowrap">
            Year
          </th>
          <th scope="col" className="w-[168px] whitespace-nowrap">
            Manufacturer
          </th>
          <th scope="col" className="w-[132px] whitespace-nowrap">
            Category
          </th>
          <th scope="col" className="w-[150px] whitespace-nowrap">
            Rating
          </th>
          <th scope="col" className="w-[168px] whitespace-nowrap">
            Latest Progress
          </th>
          <th scope="col" className="w-[180px] whitespace-nowrap">
            Latest Snapshot
          </th>
        </THead>
        <TBody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const progress = formatLatestProgress(
                row.cardsOwned,
                row.totalCards,
                row.percentComplete,
              );

              return (
                <tr
                  key={row.id}
                  className="border-b border-[color:var(--table-row-divider)] last:border-0"
                  data-testid={rowTestId}
                >
                  <td>
                    <Link
                      href={`${detailBasePath}/${row.id}`}
                      className="text-base font-semibold text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                    >
                      {row.setName}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--collector-ink)]/60">
                      {`${row.snapshotCount} ${row.snapshotCount === 1 ? "snapshot" : "snapshots"}`}
                    </p>
                  </td>
                  <td className="whitespace-nowrap font-semibold tabular-nums text-[color:var(--collector-ink)]">
                    {row.releaseYear}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                    {row.manufacturer}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                    {row.categoryTag ?? "-"}
                  </td>
                  <td className="whitespace-nowrap">
                    {row.rating !== undefined ? (
                      <span className={ratingBadgeClassName}>
                        {formatSetCollectorRating(row.rating)}
                      </span>
                    ) : (
                      <span className="font-semibold text-[color:var(--collector-ink)]/70">
                        Not rated
                      </span>
                    )}
                  </td>
                  <td className="font-semibold text-[color:var(--collector-ink)]">
                    <div>{progress.counts}</div>
                    <p className="mt-1 text-xs font-medium text-[color:var(--collector-ink)]/70">
                      {progress.percent}
                    </p>
                  </td>
                  <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                    {row.latestSnapshotDate ? (
                      <time dateTime={row.latestSnapshotDate}>
                        {fmtDate(row.latestSnapshotDate)}
                      </time>
                    ) : (
                      "Not available"
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={7}
                className="text-sm text-[color:var(--collector-ink)]/80"
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
