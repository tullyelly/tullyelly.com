import type { Metadata } from "next";

import { fmtDate } from "@/lib/datetime";
import { getReviewRouteConfig } from "@/lib/review-route-config";
import type { ReviewPageData } from "@/lib/review-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import type { ReviewType } from "@/lib/review-types";

export function getReviewCollectionMetadata(reviewType: ReviewType): Metadata {
  const config = getReviewRouteConfig(reviewType);

  return {
    title: config.collectionMetaTitle,
    description: config.collectionMetaDescription,
    alternates: { canonical: canonicalUrl(config.collectionPath.slice(1)) },
    openGraph: {
      title: config.collectionMetaTitle,
      description: config.collectionMetaDescription,
      url: config.collectionPath,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: config.collectionMetaTitle,
      description: config.collectionMetaDescription,
    },
  };
}

export function getReviewDetailMetadata(
  reviewType: ReviewType,
  externalId: string,
  reviewData: ReviewPageData | null,
): Metadata {
  const config = getReviewRouteConfig(reviewType);
  const subjectName = reviewData?.name ?? `${config.singularLabel} ${externalId}`;
  const averageRating = reviewData?.summary.averageRating ?? 0;
  const visitCount = reviewData?.summary.visitCount ?? 0;
  const visitLabel =
    visitCount === 1 ? config.countSingularLabel : config.countLabel.toLowerCase();
  const latestPostDate = reviewData?.summary.latestPostDate;
  const latestPhrase = latestPostDate
    ? ` Latest chronicle: ${fmtDate(latestPostDate)}.`
    : "";
  const title = `${subjectName} | ${config.detailMetaSuffix}`;
  const description = `Average rating: ${averageRating.toFixed(1)}/10 from ${visitCount} tracked ${visitLabel}.${latestPhrase}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `${config.collectionPath.slice(1)}/${encodeURIComponent(externalId)}`,
      ),
    },
    openGraph: {
      title,
      description,
      url: `${config.collectionPath}/${encodeURIComponent(externalId)}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
