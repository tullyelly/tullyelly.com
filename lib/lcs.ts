import "server-only";
import { allPosts } from "contentlayer/generated";

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

type LcsSectionWithOffset = LcsSection & { offset: number };

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const REVIEW_ATTR_NAME = "review";
const REVIEW_OBJECT_ATTR = new RegExp(
  `${REVIEW_ATTR_NAME}\\s*=\\s*\\{\\s*\\{([\\s\\S]*?)\\}\\s*\\}`,
);
const LCS_RATING_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?\s*$/;

const normalizeLcsId = (value: string | number): string => String(value).trim();

export const getLcsIdAttribute = (lcsId: string | number) =>
  `review={{ type: "lcs", id: "${normalizeLcsId(lcsId)}" }}`;

const extractReviewObject = (openingTag: string): string | undefined =>
  openingTag.match(REVIEW_OBJECT_ATTR)?.[1];

const extractReviewField = (
  reviewObject: string,
  fieldName: string,
): string | undefined => {
  const doubleQuoted = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*"([^"]+)"`),
  )?.[1];
  if (doubleQuoted?.trim()) return doubleQuoted.trim();

  const singleQuoted = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*'([^']+)'`),
  )?.[1];
  if (singleQuoted?.trim()) return singleQuoted.trim();

  const numeric = reviewObject.match(
    new RegExp(`${fieldName}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`),
  )?.[1];
  if (numeric?.trim()) return numeric.trim();

  return undefined;
};

const extractLcsReview = (
  openingTag: string,
): {
  lcsId: string;
  lcsName?: string;
  lcsUrl?: string;
  lcsRating?: string;
} | null => {
  const reviewObject = extractReviewObject(openingTag);
  if (!reviewObject) return null;

  const reviewType = extractReviewField(reviewObject, "type");
  if (reviewType !== "lcs") return null;

  const reviewId = extractReviewField(reviewObject, "id");
  if (!reviewId) return null;

  const reviewName = extractReviewField(reviewObject, "name");
  const reviewUrl = extractReviewField(reviewObject, "url");
  const reviewRating = extractReviewField(reviewObject, "rating");

  return {
    lcsId: normalizeLcsId(reviewId),
    lcsName: reviewName,
    lcsUrl: reviewUrl,
    lcsRating: reviewRating,
  };
};

const parseLcsRating = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const match = value.match(LCS_RATING_PATTERN);
  if (!match) return undefined;

  const parsed = Number.parseFloat(match[1] ?? "");
  if (Number.isNaN(parsed)) return undefined;

  return parsed;
};

const toTimestamp = (value: string): number => {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const compareByDateAsc = (a: LcsSectionWithOffset, b: LcsSectionWithOffset) => {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const compareLcsIds = (a: string, b: string): number => {
  const aAsNumber = Number(a);
  const bAsNumber = Number(b);
  const bothNumeric = !Number.isNaN(aAsNumber) && !Number.isNaN(bAsNumber);
  if (bothNumeric) return aAsNumber - bAsNumber;
  return a.localeCompare(b);
};

const compareLcsSummaryDesc = (a: LcsSummary, b: LcsSummary): number => {
  const dateDiff = toTimestamp(b.latestPostDate) - toTimestamp(a.latestPostDate);
  if (dateDiff !== 0) return dateDiff;
  return compareLcsIds(b.lcsId, a.lcsId);
};

export const extractLcsSectionsWithOffsets = (
  raw: string,
  lcsId?: string,
): ExtractedLcsSection[] => {
  const results: ExtractedLcsSection[] = [];
  if (!raw) return results;

  let index = 0;

  while (index < raw.length) {
    const openIndex = raw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) break;

    const tagEnd = raw.indexOf(">", openIndex + RELEASE_SECTION_OPEN.length);
    if (tagEnd === -1) break;

    const openingTag = raw.slice(openIndex, tagEnd + 1);
    const lcsReview = extractLcsReview(openingTag);
    const matchingLcsId = lcsReview?.lcsId;
    const lcsName = lcsReview?.lcsName;
    const lcsUrl = lcsReview?.lcsUrl;
    const lcsRating = lcsReview?.lcsRating;
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!matchingLcsId) {
      index = tagEnd + 1;
      continue;
    }

    if (lcsId && matchingLcsId !== lcsId) {
      index = tagEnd + 1;
      continue;
    }

    if (isSelfClosing) {
      results.push({
        mdx: openingTag,
        offset: openIndex,
        lcsId: matchingLcsId,
        lcsName,
        lcsUrl,
        lcsRating,
      });
      index = tagEnd + 1;
      continue;
    }

    const closeIndex = raw.indexOf(RELEASE_SECTION_CLOSE, tagEnd + 1);
    if (closeIndex === -1) break;

    const endIndex = closeIndex + RELEASE_SECTION_CLOSE.length;
    results.push({
      mdx: raw.slice(openIndex, endIndex),
      offset: openIndex,
      lcsId: matchingLcsId,
      lcsName,
      lcsUrl,
      lcsRating,
    });
    index = endIndex;
  }

  return results;
};

export const getLcsSections = (
  lcsId: string | number,
  posts: PostSource[] = allPosts,
): LcsSection[] => {
  const normalizedLcsId = normalizeLcsId(lcsId);
  if (!normalizedLcsId) return [];

  const extracted: LcsSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractLcsSectionsWithOffsets(raw, normalizedLcsId);

    for (const section of sections) {
      extracted.push({
        ...section,
        lcsId: section.lcsId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
    }
  }

  if (extracted.length === 0) return [];

  return extracted.sort(compareByDateAsc).map(({ offset: _offset, ...rest }) => rest);
};

export const summarizeLcsSections = (
  sections: LcsSection[],
): { lcsName?: string; lcsUrl?: string; averageRating: number; visitCount: number } => {
  const lcsName = sections
    .map((section) => section.lcsName?.trim())
    .find((name): name is string => Boolean(name));

  const lcsUrl = sections
    .map((section) => section.lcsUrl?.trim())
    .find((url): url is string => Boolean(url));

  let total = 0;
  let count = 0;

  for (const section of sections) {
    const parsed = parseLcsRating(section.lcsRating);
    if (parsed === undefined) continue;

    total += parsed;
    count += 1;
  }

  const averageRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  return {
    lcsName,
    lcsUrl,
    averageRating,
    visitCount: sections.length,
  };
};

export const getAllLcsSummaries = (posts: PostSource[] = allPosts): LcsSummary[] => {
  const byLcs = new Map<string, LcsSectionWithOffset[]>();

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractLcsSectionsWithOffsets(raw);

    for (const section of sections) {
      const lcsSections = byLcs.get(section.lcsId) ?? [];
      lcsSections.push({
        ...section,
        lcsId: section.lcsId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
      byLcs.set(section.lcsId, lcsSections);
    }
  }

  if (byLcs.size === 0) return [];

  const summaries: LcsSummary[] = [];
  for (const [lcsId, sections] of byLcs.entries()) {
    const orderedSections = [...sections].sort(compareByDateAsc);
    const summary = summarizeLcsSections(orderedSections);
    const latestPostDate = orderedSections[orderedSections.length - 1]?.postDate ?? "";

    summaries.push({
      lcsId,
      lcsName: summary.lcsName ?? `Card Shop ${lcsId}`,
      lcsUrl: summary.lcsUrl,
      averageRating: summary.averageRating,
      visitCount: summary.visitCount,
      latestPostDate,
    });
  }

  return summaries.sort(compareLcsSummaryDesc);
};

export const getLcsPageData = (
  lcsId: string | number,
  posts: PostSource[] = allPosts,
): LcsPageData | null => {
  const normalizedLcsId = normalizeLcsId(lcsId);
  if (!normalizedLcsId) return null;

  const sections = getLcsSections(normalizedLcsId, posts);
  if (sections.length === 0) return null;

  const summary = summarizeLcsSections(sections);

  return {
    lcsId: normalizedLcsId,
    lcsName: summary.lcsName ?? `Card Shop ${normalizedLcsId}`,
    lcsUrl: summary.lcsUrl,
    summary: {
      averageRating: summary.averageRating,
      visitCount: summary.visitCount,
    },
    sections,
  };
};
