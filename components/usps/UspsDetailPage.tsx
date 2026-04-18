import Link from "next/link";

import FullBleedPage from "@/components/layout/FullBleedPage";
import UspsChronicleFeed from "@/components/usps/UspsChronicleFeed";
import type { UspsPageData } from "@/lib/usps-content";
import { fmtDate } from "@/lib/datetime";
import type { UspsRouteConfig } from "@/lib/usps-route-config";

type UspsDetailPageProps = {
  config: UspsRouteConfig;
  usps: UspsPageData;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--usps-link)] shadow-sm transition hover:bg-[color:var(--usps-accent-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

export default async function UspsDetailPage({
  config,
  usps,
}: UspsDetailPageProps) {
  const summaryStats: Array<{
    badgeClassName?: string;
    label: string;
    value: string;
    valueContainerClassName?: string;
  }> = [
    {
      label: config.locationLabel,
      value: usps.cityName,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.stateLabel,
      value: usps.state,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.ratingLabel,
      value: formatRating(usps.rating),
      badgeClassName:
        "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--usps-accent)] px-3 py-1 text-[color:var(--usps-pill-fg)] shadow-sm",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.countLabel,
      value: String(usps.visitCount),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.firstCountLabel,
      value: formatVisitDate(usps.firstVisitDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.latestCountLabel,
      value: formatVisitDate(usps.latestVisitDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={config.pageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--usps-accent)_0%,var(--usps-accent-deep)_100%)] text-[color:var(--usps-pill-fg)] shadow-sm">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="space-y-2 md:grid md:grid-cols-[max-content_minmax(0,1fr)_max-content] md:items-center md:gap-x-4 md:space-y-0">
              <Link href={config.collectionPath} className={topLinkClassName}>
                {`← ${config.detailBackLabel}`}
              </Link>
              <div className="min-w-0 space-y-2 md:px-4 md:text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                  {config.detailHeroEyebrow}
                </p>
                <div className="text-[1.45rem] font-bold leading-none md:text-[1.8rem]">
                  {`${usps.cityName}, ${usps.state}`}
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
                    {stat.badgeClassName ? (
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

        <section aria-labelledby="usps-chronicle-feed" className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--usps-link)]/70">
              {config.detailHeroEyebrow}
            </p>
            <h2
              id="usps-chronicle-feed"
              className="text-2xl font-semibold leading-tight text-[color:var(--usps-ink)] md:text-3xl"
            >
              {config.detailFeedHeading}
            </h2>
            <p className="text-[15px] leading-7 text-[color:var(--usps-ink)]/80 md:text-[16px]">
              {config.detailFeedDescription}
            </p>
          </div>

          <UspsChronicleFeed
            days={usps.days}
            entryLabel={config.entryLabel}
            emptyMessage={config.emptyFeedMessage}
            missingContentMessage={config.missingContentMessage}
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
