import Link from "next/link";

import FullBleedPage from "@/components/layout/FullBleedPage";
import ReviewChronicleFeed from "@/components/reviews/ReviewChronicleFeed";
import type { ReviewPageData } from "@/lib/review-content";
import type { ReviewRouteConfig } from "@/lib/review-route-config";
import { fmtDate } from "@/lib/datetime";

type ReviewDetailPageProps = {
  config: ReviewRouteConfig;
  review: ReviewPageData;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--review-link)] shadow-sm transition hover:bg-[color:var(--review-accent-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

function buildReviewSummaryStats(
  config: ReviewRouteConfig,
  review: ReviewPageData,
): Array<{
  badgeClassName?: string;
  href?: string;
  label: string;
  value: string;
  valueContainerClassName?: string;
}> {
  return [
    {
      label: config.subjectLabel,
      value: review.name,
      href: review.url,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: "Average Rating",
      value: `${review.summary.averageRating.toFixed(1)}/10`,
      badgeClassName:
        "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--review-accent)] px-3 py-1 text-[color:var(--review-pill-fg)] shadow-sm",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.countLabel,
      value: String(review.summary.visitCount),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.latestCountLabel,
      value: review.summary.latestPostDate
        ? fmtDate(review.summary.latestPostDate, "America/Chicago", "long")
        : "Not available",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.subjectIdLabel,
      value: review.externalId,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];
}

export default async function ReviewDetailPage({
  config,
  review,
}: ReviewDetailPageProps) {
  const summaryStats = buildReviewSummaryStats(config, review);

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={config.pageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--review-accent)_0%,var(--review-accent-deep)_100%)] text-[color:var(--review-pill-fg)] shadow-sm">
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
                  {review.name}
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`${topLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                {`← ${config.detailBackLabel}`}
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
                      <a
                        href={stat.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--review-link)] shadow-sm transition hover:bg-[color:var(--review-accent-soft)] xl:whitespace-nowrap ${summaryValueClassName}`}
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

        <section
          aria-labelledby={`${config.type}-chronicle-feed`}
          className="space-y-5"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--review-link)]/70">
              {config.detailHeroEyebrow}
            </p>
            <h2
              id={`${config.type}-chronicle-feed`}
              className="text-2xl font-semibold leading-tight text-[color:var(--review-ink)] md:text-3xl"
            >
              {config.detailFeedHeading}
            </h2>
            <p className="text-[15px] leading-7 text-[color:var(--review-ink)]/80 md:text-[16px]">
              {config.detailFeedDescription}
            </p>
          </div>

          <ReviewChronicleFeed
            sections={review.sections}
            entryLabel={config.entryLabel}
            emptyMessage={config.emptyFeedMessage}
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
