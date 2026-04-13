import Link from "next/link";

import FullBleedPage from "@/components/layout/FullBleedPage";
import BricksChronicleFeed from "@/components/bricks/BricksChronicleFeed";
import type { BricksPageData } from "@/lib/bricks-content";
import type { BricksRouteConfig } from "@/lib/bricks-route-config";
import { formatBricksReviewScore } from "@/lib/bricks-types";
import { fmtDate } from "@/lib/datetime";

type BricksDetailPageProps = {
  config: BricksRouteConfig;
  bricks: BricksPageData;
};

const topLinkClassName =
  "inline-flex items-center rounded-full border border-white bg-white px-3 py-1.5 text-sm font-semibold leading-snug text-[color:var(--bricks-link)] shadow-sm transition hover:bg-[color:var(--bricks-accent-soft)]";
const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem] xl:whitespace-nowrap";

function formatSessionDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

export default async function BricksDetailPage({
  config,
  bricks,
}: BricksDetailPageProps) {
  const summaryStats: Array<{
    badgeClassName?: string;
    label: string;
    value: string;
    valueContainerClassName?: string;
  }> = [
    {
      label: config.subjectLabel,
      value: bricks.setName,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.subjectIdLabel,
      value: bricks.publicId,
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.scoreLabel,
      value: formatBricksReviewScore(bricks.reviewScore),
      badgeClassName:
        "inline-flex min-h-[2.25rem] items-center rounded-full bg-[color:var(--bricks-accent)] px-3 py-1 text-[color:var(--bricks-pill-fg)] shadow-sm",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.countLabel,
      value: String(bricks.sessionCount),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.tagLabel,
      value: bricks.tag ?? "Not available",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.pieceCountLabel,
      value:
        bricks.pieceCount !== undefined
          ? String(bricks.pieceCount)
          : "Not available",
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.firstCountLabel,
      value: formatSessionDate(bricks.firstBuildDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
    {
      label: config.latestCountLabel,
      value: formatSessionDate(bricks.latestBuildDate),
      valueContainerClassName: "flex min-h-[2.25rem] items-center",
    },
  ];

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={config.pageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--bricks-accent)_0%,var(--bricks-accent-deep)_100%)] text-[color:var(--bricks-pill-fg)] shadow-sm">
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
                  {bricks.setName}
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`${topLinkClassName} invisible hidden whitespace-nowrap md:inline-flex`}
              >
                {`← ${config.detailBackLabel}`}
              </span>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-4">
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

        <section
          aria-labelledby={`${config.subset}-chronicle-feed`}
          className="space-y-5"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--bricks-link)]/70">
              {config.detailHeroEyebrow}
            </p>
            <h2
              id={`${config.subset}-chronicle-feed`}
              className="text-2xl font-semibold leading-tight text-[color:var(--bricks-ink)] md:text-3xl"
            >
              {config.detailFeedHeading}
            </h2>
            <p className="text-[15px] leading-7 text-[color:var(--bricks-ink)]/80 md:text-[16px]">
              {config.detailFeedDescription}
            </p>
          </div>

          <BricksChronicleFeed
            days={bricks.days}
            entryLabel={config.entryLabel}
            emptyMessage={config.emptyFeedMessage}
            missingContentMessage={config.missingContentMessage}
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
