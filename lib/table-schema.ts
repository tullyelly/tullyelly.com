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

export type TableSchemaSection = {
  tableSchemaId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  tableSchemaName?: string;
  tableSchemaUrl?: string;
  tableSchemaRating?: string;
  mdx: string;
};

export type TableSchemaSummary = {
  tableSchemaId: string;
  tableSchemaName: string;
  tableSchemaUrl?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

export type TableSchemaPageData = {
  tableSchemaId: string;
  tableSchemaName: string;
  tableSchemaUrl?: string;
  summary: {
    averageRating: number;
    visitCount: number;
    latestPostDate: string;
  };
  sections: TableSchemaSection[];
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractedTableSchemaSection = {
  mdx: string;
  offset: number;
  tableSchemaId: string;
  tableSchemaName?: string;
  tableSchemaUrl?: string;
  tableSchemaRating?: string;
};

function toTableSchemaSection(section: ReviewSection): TableSchemaSection {
  return {
    tableSchemaId: section.externalId,
    postSlug: section.postSlug,
    postUrl: section.postUrl,
    postDate: section.postDate,
    postTitle: section.postTitle,
    ...(section.name ? { tableSchemaName: section.name } : {}),
    ...(section.url ? { tableSchemaUrl: section.url } : {}),
    ...(section.ratingRaw ? { tableSchemaRating: section.ratingRaw } : {}),
    mdx: section.mdx,
  };
}

function toTableSchemaSummary(summary: ReviewSummary): TableSchemaSummary {
  return {
    tableSchemaId: summary.externalId,
    tableSchemaName: summary.name,
    ...(summary.url ? { tableSchemaUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
    latestPostDate: summary.latestPostDate,
  };
}

export const getTableSchemaIdAttribute = (tableSchemaId: string | number) =>
  getReviewIdAttribute("table-schema", tableSchemaId);

export const extractTableSchemaSectionsWithOffsets = (
  raw: string,
  tableSchemaId?: string,
): ExtractedTableSchemaSection[] =>
  extractReviewSectionsWithOffsets(raw, {
    reviewType: "table-schema",
    ...(tableSchemaId ? { externalId: String(tableSchemaId).trim() } : {}),
  }).map((section) => ({
    mdx: section.mdx,
    offset: section.offset,
    tableSchemaId: section.externalId,
    ...(section.name ? { tableSchemaName: section.name } : {}),
    ...(section.url ? { tableSchemaUrl: section.url } : {}),
    ...(section.ratingRaw ? { tableSchemaRating: section.ratingRaw } : {}),
  }));

export const getTableSchemaSections = (
  tableSchemaId: string | number,
  posts?: PostSource[],
): TableSchemaSection[] =>
  getReviewSections("table-schema", tableSchemaId, posts).map(
    toTableSchemaSection,
  );

export const summarizeTableSchemaSections = (
  sections: TableSchemaSection[],
): {
  tableSchemaName?: string;
  tableSchemaUrl?: string;
  averageRating: number;
  visitCount: number;
} => {
  const summary = summarizeReviewSections(
    "table-schema",
    sections.map((section) => ({
      externalId: section.tableSchemaId,
      name: section.tableSchemaName,
      url: section.tableSchemaUrl,
      ratingRaw: section.tableSchemaRating,
      postDate: section.postDate,
    })),
  );

  return {
    ...(summary.name ? { tableSchemaName: summary.name } : {}),
    ...(summary.url ? { tableSchemaUrl: summary.url } : {}),
    averageRating: summary.averageRating,
    visitCount: summary.visitCount,
  };
};

export const getAllTableSchemaSummaries = async (
  posts?: PostSource[],
): Promise<TableSchemaSummary[]> =>
  (await listReviewSummaries("table-schema", posts)).map(toTableSchemaSummary);

export const getTableSchemaPageData = async (
  tableSchemaId: string | number,
  posts?: PostSource[],
): Promise<TableSchemaPageData | null> => {
  const data = await getReviewPageData("table-schema", tableSchemaId, posts);
  if (!data) {
    return null;
  }

  return {
    tableSchemaId: data.externalId,
    tableSchemaName:
      data.name || getReviewFallbackName("table-schema", data.externalId),
    ...(data.url ? { tableSchemaUrl: data.url } : {}),
    summary: data.summary,
    sections: data.sections.map(toTableSchemaSection),
  };
};
