import "server-only";

import { allPosts } from "contentlayer/generated";

import {
  getLcsSummaryFromDb,
  listLcsDaysFromDb,
  listLcsSummariesFromDb,
} from "@/lib/lcs-db";
import { normalizeLcsSlug, type LcsDay, type LcsSummary } from "@/lib/lcs-types";

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractLcsOptions = {
  slug?: string;
};

type LcsCore = {
  slug: string;
};

type LcsSectionWithOffset = LcsSection & { offset: number };

export type ExtractedLcsSection = LcsCore & {
  mdx: string;
  offset: number;
  sectionOrdinal: number;
};

export type LcsSection = LcsCore & {
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  mdx: string;
  sectionOrdinal: number;
};

export type LcsSourcePost = {
  slug: string;
  url: string;
  date: string;
  title?: string;
};

export type LcsNarrativeDay = LcsDay & {
  sections: LcsSection[];
  sourcePosts: LcsSourcePost[];
};

export type LcsPageData = LcsSummary & {
  days: LcsNarrativeDay[];
};

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const LCS_ATTR =
  /(?:^|\s)lcs\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*"([^"]+)"\s*\}|\{\s*'([^']+)'\s*\})/;
const FENCED_CODE_BLOCK_PATTERN =
  /(^|\n)[ \t]*```[\s\S]*?^[ \t]*```[ \t]*(?=\n|$)/gm;

const stripFencedCodeBlocks = (source: string): string =>
  source.replace(FENCED_CODE_BLOCK_PATTERN, "\n");

function normalizeLcsSlugOrNull(value: string): string | null {
  try {
    return normalizeLcsSlug(value);
  } catch {
    return null;
  }
}

function extractLcsSlugFromOpeningTag(openingTag: string): string | null {
  const match = openingTag.match(LCS_ATTR);
  const rawSlug = match?.[1] ?? match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
  return normalizeLcsSlugOrNull(rawSlug);
}

const normalizeLcsPostDate = (value: string): string => {
  const trimmed = value.trim();
  const leadingDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return leadingDate?.[1] ?? trimmed;
};

const toTimestamp = (value: string): number => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function compareLcsSectionsByDateAsc(
  a: LcsSectionWithOffset,
  b: LcsSectionWithOffset,
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

function toLcsSection(
  post: PostSource,
  extracted: ExtractedLcsSection,
): LcsSectionWithOffset {
  return {
    ...extracted,
    postSlug: post.slug,
    postUrl: post.url,
    postDate: normalizeLcsPostDate(post.date),
    postTitle: post.title ?? post.slug,
  };
}

export function getLcsAttribute(slug: string): string {
  return `lcs="${normalizeLcsSlug(slug)}"`;
}

export function extractLcsSectionsWithOffsets(
  raw: string,
  options: ExtractLcsOptions = {},
): ExtractedLcsSection[] {
  const results: ExtractedLcsSection[] = [];
  const searchableRaw = stripFencedCodeBlocks(raw);

  if (!searchableRaw) {
    return results;
  }

  const normalizedSlug = options.slug
    ? normalizeLcsSlugOrNull(options.slug)
    : undefined;

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
    const slug = extractLcsSlugFromOpeningTag(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!slug) {
      index = tagEnd + 1;
      continue;
    }

    sectionOrdinal += 1;

    const matchesSlug = normalizedSlug === undefined || slug === normalizedSlug;

    if (!matchesSlug) {
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
        slug,
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
      slug,
      mdx: searchableRaw.slice(openIndex, endIndex),
      offset: openIndex,
      sectionOrdinal,
    });
    index = endIndex;
  }

  return results;
}

export function getLcsSections(
  slug: string,
  posts: PostSource[] = allPosts,
): LcsSection[] {
  const normalizedSlug = normalizeLcsSlugOrNull(slug);
  if (!normalizedSlug) {
    return [];
  }

  const extracted: LcsSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractLcsSectionsWithOffsets(raw, { slug: normalizedSlug });

    for (const section of sections) {
      extracted.push(toLcsSection(post, section));
    }
  }

  return extracted
    .sort(compareLcsSectionsByDateAsc)
    .map(({ offset: _offset, ...section }) => section);
}

export async function getLcsNarrativeDays(
  slug: string,
  posts: PostSource[] = allPosts,
): Promise<LcsNarrativeDay[]> {
  const normalizedSlug = normalizeLcsSlugOrNull(slug);
  if (!normalizedSlug) {
    return [];
  }

  const visitDays = await listLcsDaysFromDb(normalizedSlug);

  if (visitDays.length === 0) {
    return [];
  }

  const sections = getLcsSections(normalizedSlug, posts);
  const sectionsByDay = new Map<string, LcsSection[]>();
  const sourcePostsByDay = new Map<string, LcsSourcePost[]>();

  for (const section of sections) {
    const visitDate = section.postDate;
    const daySections = sectionsByDay.get(visitDate);

    if (daySections) {
      daySections.push(section);
    } else {
      sectionsByDay.set(visitDate, [section]);
    }

    const sourcePosts = sourcePostsByDay.get(visitDate) ?? [];
    if (!sourcePosts.some((post) => post.url === section.postUrl)) {
      sourcePosts.push({
        slug: section.postSlug,
        url: section.postUrl,
        date: section.postDate,
        title: section.postTitle,
      });
      sourcePostsByDay.set(visitDate, sourcePosts);
    }
  }

  return visitDays.map((day) => ({
    ...day,
    sections: sectionsByDay.get(day.visitDate) ?? [],
    sourcePosts: sourcePostsByDay.get(day.visitDate) ?? [],
  }));
}

export async function listLcsSummaries(): Promise<LcsSummary[]> {
  return listLcsSummariesFromDb();
}

export async function getLcsPageData(
  slug: string,
  posts: PostSource[] = allPosts,
): Promise<LcsPageData | null> {
  const normalizedSlug = normalizeLcsSlugOrNull(slug);
  if (!normalizedSlug) {
    return null;
  }

  const [summary, days] = await Promise.all([
    getLcsSummaryFromDb(normalizedSlug),
    getLcsNarrativeDays(normalizedSlug, posts),
  ]);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    days,
  };
}
