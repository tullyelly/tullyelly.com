import Link from "next/link";

import FullBleedPage from "@/components/layout/FullBleedPage";
import LcsChronicleFeed from "@/components/lcs/LcsChronicleFeed";
import type { LcsPageData } from "@/lib/lcs-content";
import { fmtDate } from "@/lib/datetime";
import type { LcsRouteConfig } from "@/lib/lcs-route-config";

type LcsDetailPageProps = {
  config: LcsRouteConfig;
  lcs: LcsPageData;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--lcs-link)] shadow-sm transition hover:bg-[color:var(--lcs-accent-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

function formatLocation(lcs: Pick<LcsPageData, "city" | "state">): string | null {
  const parts = [lcs.city, lcs.state].filter(
    (value): value is string => Boolean(value),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function LcsDetailPage({
  config,
  lcs,
}: LcsDetailPageProps) {
  const location = formatLocation(lcs);
  const summaryStats: Array<{
    badgeClassName?: string;
    href?: string;
    label: string;
    value: string;
    valueContainerClassName?: string;
  }> = [
    {
      label: config.shopLabel,
      value: lcs.name,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.slugLabel,
      value: lcs.slug,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    ...(location
      ? [
          {
            label: config.locationLabel,
            value: location,
            valueContainerClassName: "flex min-h-[2.25rem] items-center",
          },
        ]
      : []),
    ...(lcs.url
      ? [
          {
            label: config.siteLabel,
            value: lcs.url,
            href: lcs.url,
            valueContainerClassName: "flex min-h-[2.25rem] items-center",
          },
        ]
      : []),
    {
      label: config.ratingLabel,
      value: formatRating(lcs.rating),
      badgeClassName:
        "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--lcs-accent)] px-3 py-1 text-[color:var(--lcs-pill-fg)] shadow-sm",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.countLabel,
      value: String(lcs.visitCount),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.firstCountLabel,
      value: formatVisitDate(lcs.firstVisitDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.latestCountLabel,
      value: formatVisitDate(lcs.latestVisitDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={config.pageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--lcs-accent)_0%,var(--lcs-accent-deep)_100%)] text-[color:var(--lcs-pill-fg)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link href={config.collectionPath} className={topLinkClassName}>
                {`← ${config.detailBackLabel}`}
              </Link>
              <div className="min-w-0 space-y-2 md:px-4 md:text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  {config.detailHeroEyebrow}
                </p>
                <div className="space-y-1">
                  <div className="text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                    {lcs.name}
                  </div>
                  {location ? (
                    <p className="text-sm leading-6 text-white/82">{location}</p>
                  ) : null}
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`${topLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                {`← ${config.detailBackLabel}`}
              </span>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3">
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
                        className={`inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--lcs-link)] shadow-sm transition hover:bg-[color:var(--lcs-accent-soft)] xl:whitespace-nowrap ${summaryValueClassName}`}
                      >
                        {stat.value}
                      </a>
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

        <section aria-labelledby="lcs-chronicle-feed" className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--lcs-link)]/70">
              {config.detailHeroEyebrow}
            </p>
            <h2
              id="lcs-chronicle-feed"
              className="text-2xl font-semibold leading-tight text-[color:var(--lcs-ink)] md:text-3xl"
            >
              {config.detailFeedHeading}
            </h2>
            <p className="text-[15px] leading-7 text-[color:var(--lcs-ink)]/80 md:text-[16px]">
              {config.detailFeedDescription}
            </p>
          </div>

          <LcsChronicleFeed
            days={lcs.days}
            entryLabel={config.entryLabel}
            emptyMessage={config.emptyFeedMessage}
            missingContentMessage={config.missingContentMessage}
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
