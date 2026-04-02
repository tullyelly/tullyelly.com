import "server-only";

import {
  extractReviewSectionsWithOffsets,
  getReviewIdAttribute,
  getReviewPageData,
  getReviewSections,
  listReviewSummaries,
  summarizeReviewSections,
  type ReviewSection,
  type ReviewSummary,
} from "@/lib/review-content";
import { getReviewFallbackName } from "@/lib/review-types";

export type GoldenAgeSection = {
  goldenAgeId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  goldenAgeName?: string;
  goldenAgeUrl?: string;
  goldenAgeRating?: string;
  mdx: string;
};

export type GoldenAgeSummary = {
  goldenAgeId: string;
  goldenAgeName: string;
  goldenAgeUrl?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

export type GoldenAgePageData = {
  goldenAgeId: string;
  goldenAgeName: string;
  goldenAgeUrl?: string;
  summary: {
    averageRating: number;
    visitCount: number;
    latestPostDate: string;
  };
  sections: GoldenAgeSection[];
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractedGoldenAgeSection = {
  mdx: string;
  offset: number;
  goldenAgeId: string;
  goldenAgeName?: string;
  goldenAgeUrl?: string;
  goldenAgeRating?: string;
};

function toGoldenAgeSection(section: ReviewSection): GoldenAgeSection {
  return {
    goldenAgeId: section.externalId,
    postSlug: section.postSlug,
    postUrl: section.postUrl,
    postDate: section.postDate,
    postTitle: section.postTitle,
    ...(section.name ? { goldenAgeName: section.name } : {}),
    ...(section.url ? { goldenAgeUrl: section.url } : {}),
    ...(section.ratingRaw ? { goldenAgeRating: section.ratingRaw } : {}),
    mdx: section.mdx,
  };
}

function toGoldenAgeSummary(summary: ReviewSummary): GoldenAgeSummary {
  return {
    goldenAgeId: summary.externalId,
    goldenAgeName: summary.name,
    ...(summary.url ? { goldenAgeUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
    latestPostDate: summary.latestPostDate,
  };
}

export const getGoldenAgeIdAttribute = (goldenAgeId: string | number) =>
  getReviewIdAttribute("golden-age", goldenAgeId);

export const extractGoldenAgeSectionsWithOffsets = (
  raw: string,
  goldenAgeId?: string,
): ExtractedGoldenAgeSection[] =>
  extractReviewSectionsWithOffsets(raw, {
    reviewType: "golden-age",
    ...(goldenAgeId ? { externalId: String(goldenAgeId).trim() } : {}),
  }).map((section) => ({
    mdx: section.mdx,
    offset: section.offset,
    goldenAgeId: section.externalId,
    ...(section.name ? { goldenAgeName: section.name } : {}),
    ...(section.url ? { goldenAgeUrl: section.url } : {}),
    ...(section.ratingRaw ? { goldenAgeRating: section.ratingRaw } : {}),
  }));

export const getGoldenAgeSections = (
  goldenAgeId: string | number,
  posts?: PostSource[],
): GoldenAgeSection[] =>
  getReviewSections("golden-age", goldenAgeId, posts).map(toGoldenAgeSection);

export const summarizeGoldenAgeSections = (
  sections: GoldenAgeSection[],
): {
  goldenAgeName?: string;
  goldenAgeUrl?: string;
  averageRating: number;
  visitCount: number;
} => {
  const summary = summarizeReviewSections(
    "golden-age",
    sections.map((section) => ({
      externalId: section.goldenAgeId,
      name: section.goldenAgeName,
      url: section.goldenAgeUrl,
      ratingRaw: section.goldenAgeRating,
      postDate: section.postDate,
    })),
  );

  return {
    ...(summary.name ? { goldenAgeName: summary.name } : {}),
    ...(summary.url ? { goldenAgeUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
  };
};

export const getAllGoldenAgeSummaries = async (
  posts?: PostSource[],
): Promise<GoldenAgeSummary[]> =>
  (await listReviewSummaries("golden-age", posts)).map(toGoldenAgeSummary);

export const getGoldenAgePageData = async (
  goldenAgeId: string | number,
  posts?: PostSource[],
): Promise<GoldenAgePageData | null> => {
  const data = await getReviewPageData("golden-age", goldenAgeId, posts);
  if (!data) {
    return null;
  }

  return {
    goldenAgeId: data.externalId,
    goldenAgeName:
      data.name || getReviewFallbackName("golden-age", data.externalId),
    ...(data.url ? { goldenAgeUrl: data.url } : {}),
    summary: data.summary,
    sections: data.sections.map(toGoldenAgeSection),
  };
};
