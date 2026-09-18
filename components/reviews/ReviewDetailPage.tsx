import type { ReactNode } from "react";

import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import ReviewChronicleFeed from "@/components/reviews/ReviewChronicleFeed";
import type { ReviewPageData } from "@/lib/review-content";
import type { ReviewRouteConfig } from "@/lib/review-route-config";
import { fmtDate } from "@/lib/datetime";

type ReviewDetailPageProps = {
  config: ReviewRouteConfig;
  review: ReviewPageData;
};

function buildReviewSummaryStats(
  config: ReviewRouteConfig,
  review: ReviewPageData,
): Array<{
  label: string;
  value: ReactNode;
}> {
  return [
    {
      label: config.subjectLabel,
      value: (
        <a
          href={review.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--review-link)] shadow-sm transition hover:bg-[color:var(--review-accent-soft)] xl:whitespace-nowrap"
        >
          {review.name}
        </a>
      ),
    },
    {
      label: "Average Rating",
      value: (
        <span className="inline-flex min-h-9 items-center rounded-full bg-[color:var(--review-accent)] px-3 py-1 text-[color:var(--review-pill-fg)] shadow-sm">
          {`${review.summary.averageRating.toFixed(1)}/10`}
        </span>
      ),
    },
    {
      label: config.countLabel,
      value: String(review.summary.visitCount),
    },
    {
      label: config.latestCountLabel,
      value: review.summary.latestPostDate
        ? fmtDate(review.summary.latestPostDate, "America/Chicago", "long")
        : "Not available",
    },
    {
      label: config.subjectIdLabel,
      value: review.externalId,
    },
  ];
}

export default async function ReviewDetailPage({
  config,
  review,
}: ReviewDetailPageProps) {
  const summaryStats = buildReviewSummaryStats(config, review);

  return (
    <CollectionDetailPage
      backHref={config.collectionPath}
      backLabel={config.detailBackLabel}
      eyebrow={config.detailHeroEyebrow}
      title={review.name}
      shareTitle={review.name}
      stats={summaryStats}
      statColumns={5}
      sectionId={`${config.type}-chronicle-feed`}
      sectionTitle={config.detailFeedHeading}
      sectionDescription={config.detailFeedDescription}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--review-accent)",
        accentDeep: "var(--review-accent-deep)",
        foreground: "var(--review-pill-fg)",
        ink: "var(--review-ink)",
        link: "var(--review-link)",
        linkHover: "var(--review-link-hover)",
        accentSoft: "var(--review-accent-soft)",
      }}
    >
      <ReviewChronicleFeed
        sections={review.sections}
        entryLabel={config.entryLabel}
        emptyMessage={config.emptyFeedMessage}
      />
    </CollectionDetailPage>
  );
}
