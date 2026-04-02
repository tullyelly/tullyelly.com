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

export type LcsSection = {
  lcsId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  lcsName?: string;
  lcsUrl?: string;
  lcsRating?: string;
  mdx: string;
};

export type LcsSummary = {
  lcsId: string;
  lcsName: string;
  lcsUrl?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

export type LcsPageData = {
  lcsId: string;
  lcsName: string;
  lcsUrl?: string;
  summary: {
    averageRating: number;
    visitCount: number;
    latestPostDate: string;
  };
  sections: LcsSection[];
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractedLcsSection = {
  mdx: string;
  offset: number;
  lcsId: string;
  lcsName?: string;
  lcsUrl?: string;
  lcsRating?: string;
};

function toLcsSection(section: ReviewSection): LcsSection {
  return {
    lcsId: section.externalId,
    postSlug: section.postSlug,
    postUrl: section.postUrl,
    postDate: section.postDate,
    postTitle: section.postTitle,
    ...(section.name ? { lcsName: section.name } : {}),
    ...(section.url ? { lcsUrl: section.url } : {}),
    ...(section.ratingRaw ? { lcsRating: section.ratingRaw } : {}),
    mdx: section.mdx,
  };
}

function toLcsSummary(summary: ReviewSummary): LcsSummary {
  return {
    lcsId: summary.externalId,
    lcsName: summary.name,
    ...(summary.url ? { lcsUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
    latestPostDate: summary.latestPostDate,
  };
}

export const getLcsIdAttribute = (lcsId: string | number) =>
  getReviewIdAttribute("lcs", lcsId);

export const extractLcsSectionsWithOffsets = (
  raw: string,
  lcsId?: string,
): ExtractedLcsSection[] =>
  extractReviewSectionsWithOffsets(raw, {
    reviewType: "lcs",
    ...(lcsId ? { externalId: String(lcsId).trim() } : {}),
  }).map((section) => ({
    mdx: section.mdx,
    offset: section.offset,
    lcsId: section.externalId,
    ...(section.name ? { lcsName: section.name } : {}),
    ...(section.url ? { lcsUrl: section.url } : {}),
    ...(section.ratingRaw ? { lcsRating: section.ratingRaw } : {}),
  }));

export const getLcsSections = (
  lcsId: string | number,
  posts?: PostSource[],
): LcsSection[] => getReviewSections("lcs", lcsId, posts).map(toLcsSection);

export const summarizeLcsSections = (
  sections: LcsSection[],
): {
  lcsName?: string;
  lcsUrl?: string;
  averageRating: number;
  visitCount: number;
} => {
  const summary = summarizeReviewSections(
    "lcs",
    sections.map((section) => ({
      externalId: section.lcsId,
      name: section.lcsName,
      url: section.lcsUrl,
      ratingRaw: section.lcsRating,
      postDate: section.postDate,
    })),
  );

  return {
    ...(summary.name ? { lcsName: summary.name } : {}),
    ...(summary.url ? { lcsUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
  };
};

export const getAllLcsSummaries = async (
  posts?: PostSource[],
): Promise<LcsSummary[]> =>
  (await listReviewSummaries("lcs", posts)).map(toLcsSummary);

export const getLcsPageData = async (
  lcsId: string | number,
  posts?: PostSource[],
): Promise<LcsPageData | null> => {
  const data = await getReviewPageData("lcs", lcsId, posts);
  if (!data) {
    return null;
  }

  return {
    lcsId: data.externalId,
    lcsName: data.name || getReviewFallbackName("lcs", data.externalId),
    ...(data.url ? { lcsUrl: data.url } : {}),
    summary: data.summary,
    sections: data.sections.map(toLcsSection),
  };
};
