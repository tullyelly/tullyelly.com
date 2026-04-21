import "server-only";

import { allPosts } from "contentlayer/generated";

import {
  getBricksSummaryFromDb,
  listBricksDaysFromDb,
  listBricksSummariesFromDb,
  type BricksDay,
  type BricksSummary,
} from "@/lib/bricks-db";
import {
  normalizeBricksPublicId,
  type BricksSubset,
} from "@/lib/bricks-types";

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractBricksOptions = {
  subset?: BricksSubset;
  publicId?: string;
};

type BricksCore = {
  subset: BricksSubset;
  publicId: string;
};

type BricksSectionWithOffset = BricksSection & { offset: number };

export type ExtractedBricksSection = BricksCore & {
  mdx: string;
  offset: number;
  sectionOrdinal: number;
};

export type BricksSection = BricksCore & {
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  mdx: string;
  sectionOrdinal: number;
};

export type BricksSourcePost = {
  slug: string;
  url: string;
  date: string;
  title?: string;
};

export type BricksNarrativeDay = BricksDay & {
  sections: BricksSection[];
  sourcePosts: BricksSourcePost[];
};

export type BricksPageData = BricksSummary & {
  days: BricksNarrativeDay[];
};

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const BRICKS_STRING_ATTR = /bricks\s*=\s*["']([^"']+)["']/;
const FENCED_CODE_BLOCK_PATTERN =
  /(^|\n)[ \t]*```[\s\S]*?^[ \t]*```[ \t]*(?=\n|$)/gm;

const stripFencedCodeBlocks = (source: string): string =>
  source.replace(FENCED_CODE_BLOCK_PATTERN, "\n");

function extractBricksFromOpeningTag(openingTag: string): BricksCore | null {
  const stringMatch = openingTag.match(BRICKS_STRING_ATTR);
  if (!stringMatch) {
    return null;
  }

  const id = stringMatch[1]?.trim();
  if (!id) {
    return null;
  }

  return {
    subset: "lego",
    publicId: normalizeBricksPublicId(id),
  };
}

const normalizeBricksPostDate = (value: string): string => {
  const trimmed = value.trim();
  const leadingDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return leadingDate?.[1] ?? trimmed;
};

const toTimestamp = (value: string): number => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function compareBricksSectionsByDateAsc(
  a: BricksSectionWithOffset,
  b: BricksSectionWithOffset,
): number {
  const dateDiff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) {
    return slugDiff;
  }

  const ordinalDiff = a.sectionOrdinal - b.sectionOrdinal;
  if (ordinalDiff !== 0) {
    return ordinalDiff;
  }

  return a.offset - b.offset;
}

function toBricksSection(
  post: PostSource,
  section: ExtractedBricksSection,
): BricksSectionWithOffset {
  return {
    ...section,
    postSlug: post.slug,
    postUrl: post.url,
    postDate: normalizeBricksPostDate(post.date),
    postTitle: post.title ?? post.slug,
  };
}

export function getBricksIdAttribute(
  subset: BricksSubset,
  publicId: string | number,
): string {
  void subset;
  return `bricks="${normalizeBricksPublicId(publicId)}"`;
}

export function extractBricksSectionsWithOffsets(
  raw: string,
  options: ExtractBricksOptions = {},
): ExtractedBricksSection[] {
  const results: ExtractedBricksSection[] = [];
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
    const bricks = extractBricksFromOpeningTag(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!bricks) {
      index = tagEnd + 1;
      continue;
    }

    sectionOrdinal += 1;

    const matchesSubset =
      options.subset === undefined || bricks.subset === options.subset;
    const matchesPublicId =
      options.publicId === undefined || bricks.publicId === options.publicId;

    if (!matchesSubset || !matchesPublicId) {
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
        ...bricks,
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
      ...bricks,
      mdx: searchableRaw.slice(openIndex, endIndex),
      offset: openIndex,
      sectionOrdinal,
    });
    index = endIndex;
  }

  return results;
}

export function getBricksSections(
  subset: BricksSubset,
  publicId: string | number,
  posts: PostSource[] = allPosts,
): BricksSection[] {
  const normalizedPublicId = normalizeBricksPublicId(publicId);
  const extracted: BricksSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractBricksSectionsWithOffsets(raw, {
      subset,
      publicId: normalizedPublicId,
    });

    for (const section of sections) {
      extracted.push(toBricksSection(post, section));
    }
  }

  return extracted
    .sort(compareBricksSectionsByDateAsc)
    .map(({ offset: _offset, ...section }) => section);
}

export async function getBricksNarrativeDays(
  subset: BricksSubset,
  publicId: string | number,
  posts: PostSource[] = allPosts,
): Promise<BricksNarrativeDay[]> {
  const normalizedPublicId = normalizeBricksPublicId(publicId);
  const buildDays = await listBricksDaysFromDb(subset, normalizedPublicId);

  if (buildDays.length === 0) {
    return [];
  }

  const sections = getBricksSections(subset, normalizedPublicId, posts);
  const sectionsByDay = new Map<string, BricksSection[]>();
  const sourcePostsByDay = new Map<string, BricksSourcePost[]>();

  for (const section of sections) {
    const buildDate = section.postDate;
    const daySections = sectionsByDay.get(buildDate);

    if (daySections) {
      daySections.push(section);
    } else {
      sectionsByDay.set(buildDate, [section]);
    }

    const sourcePosts = sourcePostsByDay.get(buildDate) ?? [];
    if (!sourcePosts.some((post) => post.url === section.postUrl)) {
      sourcePosts.push({
        slug: section.postSlug,
        url: section.postUrl,
        date: section.postDate,
        title: section.postTitle,
      });
      sourcePostsByDay.set(buildDate, sourcePosts);
    }
  }

  return buildDays.map((day) => ({
    ...day,
    sections: sectionsByDay.get(day.buildDate) ?? [],
    sourcePosts: sourcePostsByDay.get(day.buildDate) ?? [],
  }));
}

export async function listBricksSummaries(
  subset: BricksSubset,
): Promise<BricksSummary[]> {
  return listBricksSummariesFromDb(subset);
}

export async function getBricksPageData(
  subset: BricksSubset,
  publicId: string | number,
  posts: PostSource[] = allPosts,
): Promise<BricksPageData | null> {
  const normalizedPublicId = normalizeBricksPublicId(publicId);
  const [summary, days] = await Promise.all([
    getBricksSummaryFromDb(subset, normalizedPublicId),
    getBricksNarrativeDays(subset, normalizedPublicId, posts),
  ]);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    days,
  };
}
