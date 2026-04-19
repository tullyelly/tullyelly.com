import Image from "next/image";
import Link from "next/link";
import { Card } from "@ui";

import FullBleedPage from "@/components/layout/FullBleedPage";
import { Table, TBody, THead } from "@/components/ui/Table";
import type { SetCollectorPageData } from "@/lib/set-collector-content";
import { fmtDate } from "@/lib/datetime";
import {
  setCollectorPageThemeVars,
  setCollectorTableThemeStyle,
} from "@/lib/set-collector-theme";
import {
  formatSetCollectorPercentComplete,
  formatSetCollectorRating,
} from "@/lib/set-collector-types";

type SetCollectorDetailPageProps = {
  setCollector: SetCollectorPageData;
};

type SummaryStat = {
  label: string;
  value: string;
  badgeClassName?: string;
  href?: string;
  isExternal?: boolean;
  valueContainerClassName?: string;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--collector-link)] shadow-sm transition hover:bg-[color:var(--collector-accent-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const ratingBadgeClassName =
  "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--collector-accent)] px-3 py-1 text-sm font-semibold text-[color:var(--collector-pill-fg)] shadow-sm";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";
const mobileMetaLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--collector-ink)]/65";

function formatSnapshotDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function formatProgress(
  cardsOwned?: number,
  totalCards?: number,
): string {
  if (cardsOwned === undefined || totalCards === undefined) {
    return "Not available";
  }

  return `${cardsOwned} / ${totalCards}`;
}

function formatMissingCards(value?: number): string {
  return value === undefined ? "Not available" : String(value);
}

function formatPercent(value?: number): string {
  return value === undefined
    ? "Not available"
    : formatSetCollectorPercentComplete(value);
}

function isInternalHref(href: string): boolean {
  return href.startsWith("/");
}

function isPreviewablePhotoPath(href: string): boolean {
  return (
    isInternalHref(href) &&
    /\.(?:avif|gif|jpe?g|png|webp)$/i.test(href)
  );
}

function sortSnapshotsDesc(snapshots: SetCollectorPageData["snapshots"]) {
  return [...snapshots].sort((a, b) => {
    const diff = Date.parse(b.snapshotDate) - Date.parse(a.snapshotDate);
    if (diff !== 0) {
      return diff;
    }

    return b.id - a.id;
  });
}

function buildSummaryStats(setCollector: SetCollectorPageData): SummaryStat[] {
  return [
    {
      label: "Release Year",
      value: String(setCollector.releaseYear),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Manufacturer",
      value: setCollector.manufacturer,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Category",
      value: setCollector.categoryTag ?? "Not available",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Rating",
      value:
        setCollector.rating === undefined
          ? "Not rated"
          : formatSetCollectorRating(setCollector.rating),
      ...(setCollector.rating !== undefined
        ? {
            badgeClassName:
              "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--collector-accent)] px-3 py-1 text-[color:var(--collector-pill-fg)] shadow-sm",
          }
        : {}),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Total Cards",
      value: String(setCollector.totalCards),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Latest Progress",
      value: formatProgress(setCollector.cardsOwned, setCollector.totalCards),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Percent Complete",
      value: formatPercent(setCollector.percentComplete),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Missing Cards",
      value: formatMissingCards(setCollector.cardsMissing),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Latest Snapshot",
      value: formatSnapshotDate(setCollector.latestSnapshotDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Snapshots",
      value: String(setCollector.snapshotCount),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "TCDb Set",
      value: "Open Set",
      href: setCollector.tcdbSetUrl,
      isExternal: true,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];
}

export default function SetCollectorDetailPage({
  setCollector,
}: SetCollectorDetailPageProps) {
  const summaryStats = buildSummaryStats(setCollector);
  const snapshots = sortSnapshotsDesc(setCollector.snapshots);
  const photoPath = setCollector.completedSetPhotoPath ?? null;
  const canPreviewPhoto = photoPath ? isPreviewablePhotoPath(photoPath) : false;

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={setCollectorPageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--collector-accent)_0%,var(--collector-accent-deep)_100%)] text-[color:var(--collector-pill-fg)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link
                href="/cardattack/set-collector"
                className={`${topLinkClassName} whitespace-nowrap`}
              >
                ← Back to Set Collector
              </Link>
              <div className="min-w-0 space-y-2 md:px-4 md:text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  {`${setCollector.releaseYear} ${setCollector.manufacturer}`}
                </p>
                <div className="text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                  {setCollector.setName}
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`${topLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                ← Back to Set Collector
              </span>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-5">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-black/10 px-3.5 py-3 md:px-4 md:py-3.5"
                >
                  <dt className={summaryLabelClassName}>{stat.label}</dt>
                  <dd className={`mt-2 ${stat.valueContainerClassName ?? ""}`}>
                    {stat.href ? (
                      stat.isExternal ? (
                        <a
                          href={stat.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--collector-link)] shadow-sm transition hover:bg-[color:var(--collector-accent-soft)] xl:whitespace-nowrap ${summaryValueClassName}`}
                        >
                          {stat.value}
                        </a>
                      ) : (
                        <Link
                          href={stat.href}
                          className={`inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--collector-link)] shadow-sm transition hover:bg-[color:var(--collector-accent-soft)] xl:whitespace-nowrap ${summaryValueClassName}`}
                        >
                          {stat.value}
                        </Link>
                      )
                    ) : stat.badgeClassName ? (
                      <span
                        className={`${stat.badgeClassName} ${summaryValueClassName}`}
                      >
                        {stat.value}
                      </span>
                    ) : (
                      <span className={`block ${summaryValueClassName}`}>
                        {stat.value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {photoPath ? (
          <section aria-labelledby="set-collector-photo" className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--collector-link)]/70">
                reference path
              </p>
              <h2
                id="set-collector-photo"
                className="text-2xl font-semibold leading-tight text-[color:var(--collector-ink)] md:text-3xl"
              >
                Completed Set Photo
              </h2>
            </div>

            <Card className="overflow-hidden rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-0 shadow-sm">
              <div className="space-y-4 p-4 md:p-5">
                {canPreviewPhoto ? (
                  <Link
                    href={photoPath}
                    className="block overflow-hidden rounded-[20px]"
                    prefetch={false}
                  >
                    <Image
                      src={photoPath}
                      alt={`${setCollector.setName} completed set photo`}
                      width={1200}
                      height={900}
                      className="h-auto w-full rounded-[20px] object-cover"
                    />
                  </Link>
                ) : null}

                {isInternalHref(photoPath) ? (
                  <Link
                    href={photoPath}
                    prefetch={false}
                    className="inline-flex max-w-full items-center rounded-full border border-[color:var(--collector-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[color:var(--collector-link)] shadow-sm transition hover:bg-[color:var(--collector-accent-soft)]"
                  >
                    {photoPath}
                  </Link>
                ) : (
                  <a
                    href={photoPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center rounded-full border border-[color:var(--collector-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[color:var(--collector-link)] shadow-sm transition hover:bg-[color:var(--collector-accent-soft)]"
                  >
                    {photoPath}
                  </a>
                )}
              </div>
            </Card>
          </section>
        ) : null}

        <section
          aria-labelledby="set-collector-history"
          className="space-y-5"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--collector-link)]/70">
              progress timeline
            </p>
            <h2
              id="set-collector-history"
              className="text-2xl font-semibold leading-tight text-[color:var(--collector-ink)] md:text-3xl"
            >
              Snapshot History
            </h2>
          </div>

          <div style={setCollectorTableThemeStyle}>
            <ul className="space-y-4 md:hidden">
              {snapshots.length > 0 ? (
                snapshots.map((snapshot) => (
                  <Card
                    as="li"
                    key={`mobile-${snapshot.id}`}
                    className="overflow-hidden rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-0 shadow-sm"
                    data-testid="set-collector-snapshot-card"
                  >
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className={mobileMetaLabelClassName}>Snapshot</p>
                          <p className="text-lg font-semibold leading-tight text-[color:var(--collector-ink)]">
                            {fmtDate(snapshot.snapshotDate)}
                          </p>
                        </div>
                        <span className={ratingBadgeClassName}>
                          {formatSetCollectorPercentComplete(
                            snapshot.percentComplete,
                          )}
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <dt className={mobileMetaLabelClassName}>
                            Owned / Total
                          </dt>
                          <dd className="font-semibold text-[color:var(--collector-ink)]">
                            {formatProgress(
                              snapshot.cardsOwned,
                              snapshot.totalCards,
                            )}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className={mobileMetaLabelClassName}>Missing</dt>
                          <dd className="font-semibold text-[color:var(--collector-ink)]">
                            {snapshot.cardsMissing}
                          </dd>
                        </div>
                      </dl>

                      {snapshot.tcdbTradeId ? (
                        <Link
                          href={`/cardattack/tcdb-trades/${snapshot.tcdbTradeId}`}
                          className="inline-flex items-center rounded-full bg-[color:var(--collector-accent-soft)] px-3 py-1 text-sm font-medium text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                        >
                          {`Trade ${snapshot.tcdbTradeId}`}
                        </Link>
                      ) : (
                        <p className="text-sm text-[color:var(--collector-ink)]/70">
                          No linked trade
                        </p>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card
                  as="li"
                  className="rounded-[24px] border-2 border-[color:var(--collector-border)] bg-[color:var(--collector-surface)] p-4 text-sm text-[color:var(--collector-ink)]/80 shadow-sm"
                >
                  No snapshots have been recorded for this set yet.
                </Card>
              )}
            </ul>

            <Table
              variant="bucks"
              aria-label="Set Collector snapshot history table"
              data-testid="set-collector-snapshot-table"
              themeStyle={setCollectorTableThemeStyle}
            >
              <THead variant="bucks">
                <th scope="col" className="w-[180px] whitespace-nowrap">
                  Snapshot Date
                </th>
                <th scope="col" className="w-[160px] whitespace-nowrap">
                  Owned / Total
                </th>
                <th scope="col" className="w-[140px] whitespace-nowrap">
                  Complete
                </th>
                <th scope="col" className="w-[120px] whitespace-nowrap">
                  Missing
                </th>
                <th scope="col" className="w-[180px] whitespace-nowrap">
                  Trade
                </th>
              </THead>
              <TBody>
                {snapshots.length > 0 ? (
                  snapshots.map((snapshot) => (
                    <tr
                      key={snapshot.id}
                      className="border-b border-[color:var(--table-row-divider)] last:border-0"
                      data-testid="set-collector-snapshot-row"
                    >
                      <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                        <time dateTime={snapshot.snapshotDate}>
                          {fmtDate(snapshot.snapshotDate)}
                        </time>
                      </td>
                      <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                        {formatProgress(
                          snapshot.cardsOwned,
                          snapshot.totalCards,
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={ratingBadgeClassName}>
                          {formatSetCollectorPercentComplete(
                            snapshot.percentComplete,
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap font-semibold text-[color:var(--collector-ink)]">
                        {snapshot.cardsMissing}
                      </td>
                      <td className="whitespace-nowrap">
                        {snapshot.tcdbTradeId ? (
                          <Link
                            href={`/cardattack/tcdb-trades/${snapshot.tcdbTradeId}`}
                            className="font-semibold text-[color:var(--collector-link)] transition hover:text-[color:var(--collector-link-hover)]"
                          >
                            {snapshot.tcdbTradeId}
                          </Link>
                        ) : (
                          <span className="text-[color:var(--collector-ink)]/70">
                            No linked trade
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-sm text-[color:var(--collector-ink)]/80"
                    >
                      No snapshots have been recorded for this set yet.
                    </td>
                  </tr>
                )}
              </TBody>
            </Table>
          </div>
        </section>
      </div>
    </FullBleedPage>
  );
}
