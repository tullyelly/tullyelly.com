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

export type SavePointSection = {
  savePointId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  savePointName?: string;
  savePointUrl?: string;
  savePointRating?: string;
  mdx: string;
};

export type SavePointSummary = {
  savePointId: string;
  savePointName: string;
  savePointUrl?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

export type SavePointPageData = {
  savePointId: string;
  savePointName: string;
  savePointUrl?: string;
  summary: {
    averageRating: number;
    visitCount: number;
    latestPostDate: string;
  };
  sections: SavePointSection[];
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractedSavePointSection = {
  mdx: string;
  offset: number;
  savePointId: string;
  savePointName?: string;
  savePointUrl?: string;
  savePointRating?: string;
};

function toSavePointSection(section: ReviewSection): SavePointSection {
  return {
    savePointId: section.externalId,
    postSlug: section.postSlug,
    postUrl: section.postUrl,
    postDate: section.postDate,
    postTitle: section.postTitle,
    ...(section.name ? { savePointName: section.name } : {}),
    ...(section.url ? { savePointUrl: section.url } : {}),
    ...(section.ratingRaw ? { savePointRating: section.ratingRaw } : {}),
    mdx: section.mdx,
  };
}

function toSavePointSummary(summary: ReviewSummary): SavePointSummary {
  return {
    savePointId: summary.externalId,
    savePointName: summary.name,
    ...(summary.url ? { savePointUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
    latestPostDate: summary.latestPostDate,
  };
}

export const getSavePointIdAttribute = (savePointId: string | number) =>
  getReviewIdAttribute("save-point", savePointId);

export const extractSavePointSectionsWithOffsets = (
  raw: string,
  savePointId?: string,
): ExtractedSavePointSection[] =>
  extractReviewSectionsWithOffsets(raw, {
    reviewType: "save-point",
    ...(savePointId ? { externalId: String(savePointId).trim() } : {}),
  }).map((section) => ({
    mdx: section.mdx,
    offset: section.offset,
    savePointId: section.externalId,
    ...(section.name ? { savePointName: section.name } : {}),
    ...(section.url ? { savePointUrl: section.url } : {}),
    ...(section.ratingRaw ? { savePointRating: section.ratingRaw } : {}),
  }));

export const getSavePointSections = (
  savePointId: string | number,
  posts?: PostSource[],
): SavePointSection[] =>
  getReviewSections("save-point", savePointId, posts).map(toSavePointSection);

export const summarizeSavePointSections = (
  sections: SavePointSection[],
): {
  savePointName?: string;
  savePointUrl?: string;
  averageRating: number;
  visitCount: number;
} => {
  const summary = summarizeReviewSections(
    "save-point",
    sections.map((section) => ({
      externalId: section.savePointId,
      name: section.savePointName,
      url: section.savePointUrl,
      ratingRaw: section.savePointRating,
      postDate: section.postDate,
    })),
  );

  return {
    ...(summary.name ? { savePointName: summary.name } : {}),
    ...(summary.url ? { savePointUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
  };
};

export const getAllSavePointSummaries = async (
  posts?: PostSource[],
): Promise<SavePointSummary[]> =>
  (await listReviewSummaries("save-point", posts)).map(toSavePointSummary);

export const getSavePointPageData = async (
  savePointId: string | number,
  posts?: PostSource[],
): Promise<SavePointPageData | null> => {
  const data = await getReviewPageData("save-point", savePointId, posts);
  if (!data) {
    return null;
  }

  return {
    savePointId: data.externalId,
    savePointName:
      data.name || getReviewFallbackName("save-point", data.externalId),
    ...(data.url ? { savePointUrl: data.url } : {}),
    summary: data.summary,
    sections: data.sections.map(toSavePointSection),
  };
};
