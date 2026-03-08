import "server-only";
import { allPosts } from "contentlayer/generated";

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

type SavePointSectionWithOffset = SavePointSection & { offset: number };

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const REVIEW_ATTR_NAME = "review";
const REVIEW_OBJECT_ATTR = new RegExp(
  `${REVIEW_ATTR_NAME}\\s*=\\s*\\{\\s*\\{([\\s\\S]*?)\\}\\s*\\}`,
);
const FENCED_CODE_BLOCK_PATTERN =
  /(^|\n)[ \t]*```[\s\S]*?^[ \t]*```[ \t]*(?=\n|$)/gm;
const SAVE_POINT_RATING_PATTERN =
  /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?\s*$/;

const normalizeSavePointId = (value: string | number): string =>
  String(value).trim();

const stripFencedCodeBlocks = (source: string): string =>
  source.replace(FENCED_CODE_BLOCK_PATTERN, "\n");

export const getSavePointIdAttribute = (savePointId: string | number) =>
  `review={{ type: "save-point", id: "${normalizeSavePointId(savePointId)}" }}`;

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

const extractSavePointReview = (
  openingTag: string,
): {
  savePointId: string;
  savePointName?: string;
  savePointUrl?: string;
  savePointRating?: string;
} | null => {
  const reviewObject = extractReviewObject(openingTag);
  if (!reviewObject) return null;

  const reviewType = extractReviewField(reviewObject, "type");
  if (reviewType !== "save-point") return null;

  const reviewId = extractReviewField(reviewObject, "id");
  if (!reviewId) return null;

  const reviewName = extractReviewField(reviewObject, "name");
  const reviewUrl = extractReviewField(reviewObject, "url");
  const reviewRating = extractReviewField(reviewObject, "rating");

  return {
    savePointId: normalizeSavePointId(reviewId),
    savePointName: reviewName,
    savePointUrl: reviewUrl,
    savePointRating: reviewRating,
  };
};

const parseSavePointRating = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const match = value.match(SAVE_POINT_RATING_PATTERN);
  if (!match) return undefined;

  const parsed = Number.parseFloat(match[1] ?? "");
  if (Number.isNaN(parsed)) return undefined;

  return parsed;
};

const toTimestamp = (value: string): number => {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const compareByDateAsc = (
  a: SavePointSectionWithOffset,
  b: SavePointSectionWithOffset,
) => {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const compareSavePointIds = (a: string, b: string): number => {
  const aAsNumber = Number(a);
  const bAsNumber = Number(b);
  const bothNumeric = !Number.isNaN(aAsNumber) && !Number.isNaN(bAsNumber);
  if (bothNumeric) return aAsNumber - bAsNumber;
  return a.localeCompare(b);
};

const compareSavePointSummaryDesc = (
  a: SavePointSummary,
  b: SavePointSummary,
): number => {
  const dateDiff = toTimestamp(b.latestPostDate) - toTimestamp(a.latestPostDate);
  if (dateDiff !== 0) return dateDiff;
  return compareSavePointIds(b.savePointId, a.savePointId);
};

export const extractSavePointSectionsWithOffsets = (
  raw: string,
  savePointId?: string,
): ExtractedSavePointSection[] => {
  const results: ExtractedSavePointSection[] = [];
  const searchableRaw = stripFencedCodeBlocks(raw);
  if (!searchableRaw) return results;

  let index = 0;

  while (index < searchableRaw.length) {
    const openIndex = searchableRaw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) break;

    const tagEnd = searchableRaw.indexOf(
      ">",
      openIndex + RELEASE_SECTION_OPEN.length,
    );
    if (tagEnd === -1) break;

    const openingTag = searchableRaw.slice(openIndex, tagEnd + 1);
    const savePointReview = extractSavePointReview(openingTag);
    const matchingSavePointId = savePointReview?.savePointId;
    const savePointName = savePointReview?.savePointName;
    const savePointUrl = savePointReview?.savePointUrl;
    const savePointRating = savePointReview?.savePointRating;
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!matchingSavePointId) {
      index = tagEnd + 1;
      continue;
    }

    if (savePointId && matchingSavePointId !== savePointId) {
      index = tagEnd + 1;
      continue;
    }

    if (isSelfClosing) {
      results.push({
        mdx: openingTag,
        offset: openIndex,
        savePointId: matchingSavePointId,
        savePointName,
        savePointUrl,
        savePointRating,
      });
      index = tagEnd + 1;
      continue;
    }

    const closeIndex = searchableRaw.indexOf(RELEASE_SECTION_CLOSE, tagEnd + 1);
    if (closeIndex === -1) break;

    const endIndex = closeIndex + RELEASE_SECTION_CLOSE.length;
    results.push({
      mdx: searchableRaw.slice(openIndex, endIndex),
      offset: openIndex,
      savePointId: matchingSavePointId,
      savePointName,
      savePointUrl,
      savePointRating,
    });
    index = endIndex;
  }

  return results;
};

export const getSavePointSections = (
  savePointId: string | number,
  posts: PostSource[] = allPosts,
): SavePointSection[] => {
  const normalizedSavePointId = normalizeSavePointId(savePointId);
  if (!normalizedSavePointId) return [];

  const extracted: SavePointSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractSavePointSectionsWithOffsets(raw, normalizedSavePointId);

    for (const section of sections) {
      extracted.push({
        ...section,
        savePointId: section.savePointId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
    }
  }

  if (extracted.length === 0) return [];

  return extracted
    .sort(compareByDateAsc)
    .map(({ offset: _offset, ...rest }) => rest);
};

export const summarizeSavePointSections = (
  sections: SavePointSection[],
): {
  savePointName?: string;
  savePointUrl?: string;
  averageRating: number;
  visitCount: number;
} => {
  const savePointName = sections
    .map((section) => section.savePointName?.trim())
    .find((name): name is string => Boolean(name));

  const savePointUrl = sections
    .map((section) => section.savePointUrl?.trim())
    .find((url): url is string => Boolean(url));

  let total = 0;
  let count = 0;

  for (const section of sections) {
    const parsed = parseSavePointRating(section.savePointRating);
    if (parsed === undefined) continue;

    total += parsed;
    count += 1;
  }

  const averageRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  return {
    savePointName,
    savePointUrl,
    averageRating,
    visitCount: sections.length,
  };
};

export const getAllSavePointSummaries = (
  posts: PostSource[] = allPosts,
): SavePointSummary[] => {
  const bySavePoint = new Map<string, SavePointSectionWithOffset[]>();

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractSavePointSectionsWithOffsets(raw);

    for (const section of sections) {
      const savePointSections = bySavePoint.get(section.savePointId) ?? [];
      savePointSections.push({
        ...section,
        savePointId: section.savePointId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
      bySavePoint.set(section.savePointId, savePointSections);
    }
  }

  if (bySavePoint.size === 0) return [];

  const summaries: SavePointSummary[] = [];
  for (const [savePointId, sections] of bySavePoint.entries()) {
    const orderedSections = [...sections].sort(compareByDateAsc);
    const summary = summarizeSavePointSections(orderedSections);
    const latestPostDate =
      orderedSections[orderedSections.length - 1]?.postDate ?? "";

    summaries.push({
      savePointId,
      savePointName: summary.savePointName ?? `Save Point ${savePointId}`,
      savePointUrl: summary.savePointUrl,
      averageRating: summary.averageRating,
      visitCount: summary.visitCount,
      latestPostDate,
    });
  }

  return summaries.sort(compareSavePointSummaryDesc);
};

export const getSavePointPageData = (
  savePointId: string | number,
  posts: PostSource[] = allPosts,
): SavePointPageData | null => {
  const normalizedSavePointId = normalizeSavePointId(savePointId);
  if (!normalizedSavePointId) return null;

  const sections = getSavePointSections(normalizedSavePointId, posts);
  if (sections.length === 0) return null;

  const summary = summarizeSavePointSections(sections);

  return {
    savePointId: normalizedSavePointId,
    savePointName: summary.savePointName ?? `Save Point ${normalizedSavePointId}`,
    savePointUrl: summary.savePointUrl,
    summary: {
      averageRating: summary.averageRating,
      visitCount: summary.visitCount,
    },
    sections,
  };
};
