import "server-only";

import { allPosts } from "contentlayer/generated";

import {
  getReviewSummaryFromDb,
  listReviewReferencesFromDb,
  listReviewSummariesFromDb,
  type ReviewDbReference,
  type ReviewDbSummary,
} from "@/lib/review-db";
import {
  getReviewFallbackName,
  isReviewType,
  normalizeReviewExternalId,
  type ReviewType,
} from "@/lib/review-types";

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractReviewOptions = {
  reviewType?: ReviewType;
  externalId?: string;
};

type ReviewCore = {
  reviewType: ReviewType;
  externalId: string;
  name?: string;
  url?: string;
  ratingRaw?: string;
};

type ReviewSectionLike = {
  externalId: string;
  name?: string;
  url?: string;
  ratingRaw?: string;
  postDate: string;
};

export type ExtractedReviewSection = ReviewCore & {
  mdx: string;
  offset: number;
  sectionOrdinal: number;
};

export type ReviewSection = ReviewCore & {
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  mdx: string;
  sectionOrdinal: number;
};

export type ReviewSummary = {
  reviewType: ReviewType;
  externalId: string;
  name: string;
  url?: string;
  averageRating: number;
  visitCount: number;
  latestPostDate: string;
};

export type ReviewPageData = {
  reviewType: ReviewType;
  externalId: string;
  name: string;
  url?: string;
  summary: {
    averageRating: number;
    visitCount: number;
    latestPostDate: string;
  };
  sections: ReviewSection[];
};

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const REVIEW_OBJECT_ATTR = /review\s*=\s*\{\s*\{([\s\S]*?)\}\s*\}/;
const REVIEW_RATING_PATTERN =
  /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?\s*$/;
const FENCED_CODE_BLOCK_PATTERN =
  /(^|\n)[ \t]*```[\s\S]*?^[ \t]*```[ \t]*(?=\n|$)/gm;

const stripFencedCodeBlocks = (source: string): string =>
  source.replace(FENCED_CODE_BLOCK_PATTERN, "\n");

const extractReviewObject = (openingTag: string): string | undefined =>
  openingTag.match(REVIEW_OBJECT_ATTR)?.[1];

const extractReviewField = (
  reviewObject: string,
  fieldName: string,
): string | undefined => {
  const doubleQuoted = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*"([^"]+)"`),
  )?.[1];
  if (doubleQuoted?.trim()) {
    return doubleQuoted.trim();
  }

  const singleQuoted = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*'([^']+)'`),
  )?.[1];
  if (singleQuoted?.trim()) {
    return singleQuoted.trim();
  }

  const numeric = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`),
  )?.[1];
  if (numeric?.trim()) {
    return numeric.trim();
  }

  return undefined;
};

function extractReviewFromOpeningTag(openingTag: string): ReviewCore | null {
  const reviewObject = extractReviewObject(openingTag);
  if (!reviewObject) {
    return null;
  }

  const reviewType = extractReviewField(reviewObject, "type");
  if (!reviewType || !isReviewType(reviewType)) {
    return null;
  }

  const reviewId = extractReviewField(reviewObject, "id");
  const normalizedExternalId = reviewId
    ? normalizeReviewExternalId(reviewId)
    : "";

  if (!normalizedExternalId) {
    return null;
  }

  const reviewName = extractReviewField(reviewObject, "name");
  const reviewUrl = extractReviewField(reviewObject, "url");
  const reviewRating = extractReviewField(reviewObject, "rating");

  return {
    reviewType,
    externalId: normalizedExternalId,
    ...(reviewName ? { name: reviewName } : {}),
    ...(reviewUrl ? { url: reviewUrl } : {}),
    ...(reviewRating ? { ratingRaw: reviewRating } : {}),
  };
}

export function parseReviewRatingNumeric(
  value: string | undefined,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(REVIEW_RATING_PATTERN);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseFloat(match[1] ?? "");
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toTimestamp(value: string): number {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function compareReviewSectionsByDateAsc(
  a: ReviewSection & { offset: number },
  b: ReviewSection & { offset: number },
): number {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) {
    return diff;
  }

  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) {
    return slugDiff;
  }

  return a.offset - b.offset;
}

function compareExternalIds(a: string, b: string): number {
  const aAsNumber = Number(a);
  const bAsNumber = Number(b);
  const bothNumeric = !Number.isNaN(aAsNumber) && !Number.isNaN(bAsNumber);

  if (bothNumeric) {
    return aAsNumber - bAsNumber;
  }

  return a.localeCompare(b);
}

function compareReviewSummaryDesc(a: ReviewSummary, b: ReviewSummary): number {
  const dateDiff =
    toTimestamp(b.latestPostDate) - toTimestamp(a.latestPostDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  return compareExternalIds(b.externalId, a.externalId);
}

function getReviewSectionKey(section: {
  postSlug: string;
  sectionOrdinal: number;
}): string {
  return `${section.postSlug}:${section.sectionOrdinal}`;
}

function getReviewName(
  reviewType: ReviewType,
  externalId: string,
  name?: string,
): string {
  return name?.trim() || getReviewFallbackName(reviewType, externalId);
}

function mergeReviewSummary(
  summary: ReviewSummary,
  dbSummary?: ReviewDbSummary,
): ReviewSummary {
  return {
    ...summary,
    name: dbSummary?.name ?? summary.name,
    url: dbSummary?.url ?? summary.url,
    averageRating: dbSummary?.averageRating ?? summary.averageRating,
    visitCount: dbSummary?.visitCount ?? summary.visitCount,
    latestPostDate: dbSummary?.latestPostDate ?? summary.latestPostDate,
  };
}

function mergeReviewSection(
  section: ReviewSection,
  dbSummary?: ReviewDbSummary | null,
  dbReference?: ReviewDbReference,
): ReviewSection {
  return {
    ...section,
    ...(dbSummary?.name && !section.name ? { name: dbSummary.name } : {}),
    ...(dbSummary?.url && !section.url ? { url: dbSummary.url } : {}),
    ...(dbReference?.ratingRaw && !section.ratingRaw
      ? { ratingRaw: dbReference.ratingRaw }
      : {}),
  };
}

function toReviewSection(
  post: PostSource,
  extracted: ExtractedReviewSection,
): ReviewSection & { offset: number } {
  return {
    ...extracted,
    postSlug: post.slug,
    postUrl: post.url,
    postDate: post.date,
    postTitle: post.title ?? post.slug,
  };
}

export function getReviewIdAttribute(
  reviewType: ReviewType,
  externalId: string | number,
): string {
  return `review={{ type: "${reviewType}", id: "${normalizeReviewExternalId(externalId)}" }}`;
}

export function extractReviewSectionsWithOffsets(
  raw: string,
  options: ExtractReviewOptions = {},
): ExtractedReviewSection[] {
  const results: ExtractedReviewSection[] = [];
  const searchableRaw = stripFencedCodeBlocks(raw);
  if (!searchableRaw) {
    return results;
  }

  let index = 0;
  let sectionOrdinal = 0;

  while (index < searchableRaw.length) {
    const openIndex = searchableRaw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) {
      break;
    }

    const tagEnd = searchableRaw.indexOf(
      ">",
      openIndex + RELEASE_SECTION_OPEN.length,
    );
    if (tagEnd === -1) {
      break;
    }

    const openingTag = searchableRaw.slice(openIndex, tagEnd + 1);
    const review = extractReviewFromOpeningTag(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!review) {
      index = tagEnd + 1;
      continue;
    }

    sectionOrdinal += 1;

    const matchesType =
      options.reviewType === undefined ||
      review.reviewType === options.reviewType;
    const matchesExternalId =
      options.externalId === undefined ||
      review.externalId === options.externalId;

    if (!matchesType || !matchesExternalId) {
      if (isSelfClosing) {
        index = tagEnd + 1;
        continue;
      }

      const closeIndex = searchableRaw.indexOf(
        RELEASE_SECTION_CLOSE,
        tagEnd + 1,
      );
      if (closeIndex === -1) {
        break;
      }

      index = closeIndex + RELEASE_SECTION_CLOSE.length;
      continue;
    }

    if (isSelfClosing) {
      results.push({
        ...review,
        mdx: openingTag,
        offset: openIndex,
        sectionOrdinal,
      });
      index = tagEnd + 1;
      continue;
    }

    const closeIndex = searchableRaw.indexOf(RELEASE_SECTION_CLOSE, tagEnd + 1);
    if (closeIndex === -1) {
      break;
    }

    const endIndex = closeIndex + RELEASE_SECTION_CLOSE.length;
    results.push({
      ...review,
      mdx: searchableRaw.slice(openIndex, endIndex),
      offset: openIndex,
      sectionOrdinal,
    });
    index = endIndex;
  }

  return results;
}

export function getReviewSections(
  reviewType: ReviewType,
  externalId: string | number,
  posts: PostSource[] = allPosts,
): ReviewSection[] {
  const normalizedExternalId = normalizeReviewExternalId(externalId);
  if (!normalizedExternalId) {
    return [];
  }

  const extracted: Array<ReviewSection & { offset: number }> = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractReviewSectionsWithOffsets(raw, {
      reviewType,
      externalId: normalizedExternalId,
    });

    for (const section of sections) {
      extracted.push(toReviewSection(post, section));
    }
  }

  return extracted
    .sort(compareReviewSectionsByDateAsc)
    .map(({ offset: _offset, ...section }) => section);
}

export function summarizeReviewSections(
  reviewType: ReviewType,
  sections: ReviewSectionLike[],
): {
  name?: string;
  url?: string;
  averageRating: number;
  visitCount: number;
} {
  const externalId = sections[0]?.externalId ?? "";
  const name = sections
    .map((section) => section.name?.trim())
    .find((value): value is string => Boolean(value));

  const url = sections
    .map((section) => section.url?.trim())
    .find((value): value is string => Boolean(value));

  let total = 0;
  let count = 0;

  for (const section of sections) {
    const parsed = parseReviewRatingNumeric(section.ratingRaw);
    if (parsed === undefined) {
      continue;
    }

    total += parsed;
    count += 1;
  }

  return {
    ...(name
      ? { name }
      : externalId
        ? { name: getReviewName(reviewType, externalId) }
        : {}),
    ...(url ? { url } : {}),
    averageRating: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    visitCount: sections.length,
  };
}

export function listReviewSummariesFromContent(
  reviewType: ReviewType,
  posts: PostSource[] = allPosts,
): ReviewSummary[] {
  const byExternalId = new Map<
    string,
    Array<ReviewSection & { offset: number }>
  >();

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractReviewSectionsWithOffsets(raw, { reviewType });

    for (const section of sections) {
      const reviewSections = byExternalId.get(section.externalId) ?? [];
      reviewSections.push(toReviewSection(post, section));
      byExternalId.set(section.externalId, reviewSections);
    }
  }

  const summaries: ReviewSummary[] = [];

  for (const [externalId, sections] of byExternalId.entries()) {
    const orderedSections = [...sections].sort(compareReviewSectionsByDateAsc);
    const summary = summarizeReviewSections(reviewType, orderedSections);
    const latestPostDate =
      orderedSections[orderedSections.length - 1]?.postDate ?? "";

    summaries.push({
      reviewType,
      externalId,
      name: getReviewName(reviewType, externalId, summary.name),
      ...(summary.url ? { url: summary.url } : {}),
      averageRating: summary.averageRating,
      visitCount: summary.visitCount,
      latestPostDate,
    });
  }

  return summaries.sort(compareReviewSummaryDesc);
}

export async function listReviewSummaries(
  reviewType: ReviewType,
  posts: PostSource[] = allPosts,
): Promise<ReviewSummary[]> {
  const contentSummaries = listReviewSummariesFromContent(reviewType, posts);
  if (contentSummaries.length === 0) {
    return [];
  }

  const dbSummaries = await listReviewSummariesFromDb(reviewType);
  const dbSummariesByExternalId = new Map(
    dbSummaries.map((summary) => [summary.externalId, summary]),
  );

  return contentSummaries
    .map((summary) =>
      mergeReviewSummary(
        summary,
        dbSummariesByExternalId.get(summary.externalId),
      ),
    )
    .sort(compareReviewSummaryDesc);
}

export function findReviewSectionsByReferences(
  reviewType: ReviewType,
  externalId: string | number,
  references: ReviewDbReference[],
  posts: PostSource[] = allPosts,
): ReviewSection[] {
  const normalizedExternalId = normalizeReviewExternalId(externalId);
  if (!normalizedExternalId || references.length === 0) {
    return [];
  }

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const cachedSectionsByPost = new Map<string, ExtractedReviewSection[]>();
  const resolvedSections: Array<ReviewSection & { offset: number }> = [];

  for (const reference of references) {
    const post = postsBySlug.get(reference.postSlug);
    if (!post) {
      continue;
    }

    const extractedSections =
      cachedSectionsByPost.get(post.slug) ??
      extractReviewSectionsWithOffsets(post.body?.raw ?? "");
    cachedSectionsByPost.set(post.slug, extractedSections);

    const matchedSection = extractedSections.find(
      (section) =>
        section.sectionOrdinal === reference.sectionOrdinal &&
        section.reviewType === reviewType &&
        section.externalId === normalizedExternalId,
    );

    if (!matchedSection) {
      continue;
    }

    resolvedSections.push({
      ...toReviewSection(post, matchedSection),
      ...(reference.ratingRaw && !matchedSection.ratingRaw
        ? { ratingRaw: reference.ratingRaw }
        : {}),
    });
  }

  return resolvedSections.map(({ offset: _offset, ...section }) => section);
}

export async function getReviewPageData(
  reviewType: ReviewType,
  externalId: string | number,
  posts: PostSource[] = allPosts,
): Promise<ReviewPageData | null> {
  const normalizedExternalId = normalizeReviewExternalId(externalId);
  if (!normalizedExternalId) {
    return null;
  }

  const contentSections = getReviewSections(
    reviewType,
    normalizedExternalId,
    posts,
  );
  if (contentSections.length === 0) {
    return null;
  }

  const [dbSummary, dbReferences] = await Promise.all([
    getReviewSummaryFromDb(reviewType, normalizedExternalId),
    listReviewReferencesFromDb(reviewType, normalizedExternalId),
  ]);

  const referencedSections = findReviewSectionsByReferences(
    reviewType,
    normalizedExternalId,
    dbReferences,
    posts,
  );
  const referencedKeys = new Set(
    referencedSections.map((section) => getReviewSectionKey(section)),
  );
  const orderedSections =
    referencedSections.length > 0
      ? [
          ...referencedSections,
          ...contentSections.filter(
            (section) => !referencedKeys.has(getReviewSectionKey(section)),
          ),
        ]
      : contentSections;
  const dbReferencesByKey = new Map(
    dbReferences.map((reference) => [
      getReviewSectionKey(reference),
      reference,
    ]),
  );
  const summary = summarizeReviewSections(reviewType, orderedSections);
  const mergedSections = orderedSections.map((section) =>
    mergeReviewSection(
      section,
      dbSummary,
      dbReferencesByKey.get(getReviewSectionKey(section)),
    ),
  );

  return {
    reviewType,
    externalId: normalizedExternalId,
    name: getReviewName(
      reviewType,
      normalizedExternalId,
      dbSummary?.name ?? summary.name,
    ),
    ...((dbSummary?.url ?? summary.url)
      ? { url: dbSummary?.url ?? summary.url }
      : {}),
    summary: {
      averageRating: dbSummary?.averageRating ?? summary.averageRating,
      visitCount: dbSummary?.visitCount ?? summary.visitCount,
      latestPostDate:
        dbSummary?.latestPostDate ??
        orderedSections[orderedSections.length - 1]?.postDate ??
        "",
    },
    sections: mergedSections,
  };
}
