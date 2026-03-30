import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import FullBleedPage from "@/components/layout/FullBleedPage";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";
import { getTcdbTradeSummaryFromDb } from "@/lib/tcdb-trade-db";
import {
  getTcdbProfileUrl,
  getTcdbTradeNarrativeDays,
} from "@/lib/tcdb-trades";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import TcdbTradeChronicleFeed from "./_components/TcdbTradeTimelineSection";

type Params = { tradeId: string };
type TradeChronicleDay = Awaited<
  ReturnType<typeof getTcdbTradeNarrativeDays>
>[number] & {
  anchorId: string;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--trade-blue)] shadow-sm transition hover:bg-[color:var(--trade-blue-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

function formatTradeCount(value?: number): string {
  return value === undefined ? "-" : String(value);
}

function formatTradeDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function getDayAnchorId(tradeDate: string, side: "sent" | "received"): string {
  return `${tradeDate}-${side}`;
}

function buildChronicleDays(
  days: Awaited<ReturnType<typeof getTcdbTradeNarrativeDays>>,
): TradeChronicleDay[] {
  return days.map((day) => ({
    ...day,
    anchorId: getDayAnchorId(day.tradeDate, day.side),
  }));
}

function buildMetadataDescription(
  tradeId: string,
  summary: Awaited<ReturnType<typeof getTcdbTradeSummaryFromDb>>,
): string {
  if (!summary) {
    return `TCDb trade ${tradeId} detail page.`;
  }

  const parts = [
    summary.partner ? `Partner ${summary.partner}` : null,
    summary.sent !== undefined ? `${summary.sent} sent` : null,
    summary.received !== undefined ? `${summary.received} received` : null,
    summary.total !== undefined ? `${summary.total} total` : null,
    summary.startDate ? `started ${fmtDate(summary.startDate)}` : null,
    summary.endDate ? `completed ${fmtDate(summary.endDate)}` : "open trade",
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0
    ? `TCDb trade ${tradeId}; ${parts.join("; ")}.`
    : `TCDb trade ${tradeId} detail page.`;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tradeId } = await params;
  const summary = await getTcdbTradeSummaryFromDb(tradeId);
  const title = `TCDb Trade ${tradeId}`;
  const description = buildMetadataDescription(tradeId, summary);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`cardattack/tcdb-trades/${tradeId}`),
    },
    openGraph: {
      title,
      description,
      url: `/cardattack/tcdb-trades/${tradeId}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tradeId } = await params;
  const [summary, narrativeDays] = await Promise.all([
    getTcdbTradeSummaryFromDb(tradeId),
    getTcdbTradeNarrativeDays(tradeId),
  ]);

  if (!summary) {
    notFound();
  }

  const chronicleDays = buildChronicleDays(narrativeDays);
  const partnerUrl = summary.partner
    ? getTcdbProfileUrl(summary.partner)
    : null;
  const statusBadgeClassName =
    summary.status === "Completed"
      ? `inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--trade-blue)] px-3 py-1 text-[color:var(--trade-off-white)] ${summaryValueClassName}`
      : `inline-flex min-h-[2.25rem] items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[color:var(--trade-off-white)] ${summaryValueClassName}`;
  const summaryStats: Array<{
    badgeClassName?: string;
    href?: string;
    label: string;
    value: string;
    valueContainerClassName?: string;
  }> = [
    {
      label: "Trade Partner",
      value: summary.partner ?? "Not available",
      href: partnerUrl ?? undefined,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Status",
      value: summary.status,
      badgeClassName: statusBadgeClassName,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Sent",
      value: formatTradeCount(summary.sent),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Received",
      value: formatTradeCount(summary.received),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Total",
      value: formatTradeCount(summary.total),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Started",
      value: formatTradeDate(summary.startDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Last Received",
      value: summary.endDate
        ? formatTradeDate(summary.endDate)
        : "Not received yet",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={tcdbTradePageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--trade-rust)_0%,var(--trade-rust-deep)_100%)] text-[color:var(--trade-off-white)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link
                href="/cardattack/tcdb-trades"
                className={`${topLinkClassName} whitespace-nowrap`}
              >
                ← Back to TCDb trades
              </Link>
              <div className="min-w-0 text-[1.275rem] font-bold leading-none md:px-4 md:text-center md:text-[1.575rem]">
                {`TCDb Trade ${summary.tradeId}`}
              </div>
              <span
                aria-hidden="true"
                className={`${topLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                ← Back to TCDb trades
              </span>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.05fr_0.7fr_0.45fr_0.5fr_0.42fr_1.2fr_1.2fr]">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-black/10 px-3.5 py-3 md:px-4 md:py-3.5"
                >
                  <dt className={summaryLabelClassName}>{stat.label}</dt>
                  <dd className={`mt-2 ${stat.valueContainerClassName ?? ""}`}>
                    {stat.href ? (
                      <a
                        href={stat.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--trade-blue)] shadow-sm transition hover:bg-[color:var(--trade-blue-soft)] xl:whitespace-nowrap ${summaryValueClassName}`}
                      >
                        {stat.value}
                      </a>
                    ) : stat.badgeClassName ? (
                      <span className={stat.badgeClassName}>{stat.value}</span>
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

        <section aria-labelledby="trade-chronicle-feed" className="space-y-8">
          <div>
            <h2
              id="trade-chronicle-feed"
              className="text-2xl font-semibold leading-tight text-[color:var(--trade-charcoal)] md:text-3xl"
            >
              Chronicle Feed
            </h2>
          </div>

          <TcdbTradeChronicleFeed
            days={chronicleDays}
            emptyMessage="No tracked trade days are available for this trade yet."
            missingContentMessage="No chronicle content is attached to this day yet."
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
