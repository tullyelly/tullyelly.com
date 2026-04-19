import "server-only";

import { allPosts } from "contentlayer/generated";

import {
  getUspsSummaryFromDb,
  listUspsDaysFromDb,
  listUspsSummariesFromDb,
  normalizeUspsCitySlug,
  type UspsDay,
  type UspsSummary,
} from "@/lib/usps-db";

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractUspsOptions = {
  citySlug?: string;
};

type UspsCore = {
  citySlug: string;
};

type UspsSectionWithOffset = UspsSection & { offset: number };

export type ExtractedUspsSection = UspsCore & {
  mdx: string;
  offset: number;
  sectionOrdinal: number;
};

export type UspsSection = UspsCore & {
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  mdx: string;
  sectionOrdinal: number;
};

export type UspsSourcePost = {
  slug: string;
  url: string;
  date: string;
  title?: string;
};

export type UspsNarrativeDay = UspsDay & {
  sections: UspsSection[];
  sourcePosts: UspsSourcePost[];
};

export type UspsPageData = UspsSummary & {
  days: UspsNarrativeDay[];
};

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const USPS_ATTR =
  /(?:^|\s)usps\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*"([^"]+)"\s*\}|\{\s*'([^']+)'\s*\})/;
const FENCED_CODE_BLOCK_PATTERN =
  /(^|\n)[ \t]*```[\s\S]*?^[ \t]*```[ \t]*(?=\n|$)/gm;

const stripFencedCodeBlocks = (source: string): string =>
  source.replace(FENCED_CODE_BLOCK_PATTERN, "\n");

function extractUspsCitySlugFromOpeningTag(openingTag: string): string | null {
  const match = openingTag.match(USPS_ATTR);
  const rawCitySlug =
    match?.[1] ?? match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
  const normalizedCitySlug = normalizeUspsCitySlug(rawCitySlug);

  return normalizedCitySlug || null;
}

const normalizeUspsPostDate = (value: string): string => {
  const trimmed = value.trim();
  const leadingDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return leadingDate?.[1] ?? trimmed;
};

const toTimestamp = (value: string): number => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function compareUspsSectionsByDateAsc(
  a: UspsSectionWithOffset,
  b: UspsSectionWithOffset,
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

function toUspsSection(
  post: PostSource,
  extracted: ExtractedUspsSection,
): UspsSectionWithOffset {
  return {
    ...extracted,
    postSlug: post.slug,
    postUrl: post.url,
    postDate: normalizeUspsPostDate(post.date),
    postTitle: post.title ?? post.slug,
  };
}

export function getUspsCityAttribute(citySlug: string): string {
  return `usps="${normalizeUspsCitySlug(citySlug)}"`;
}

export function extractUspsSectionsWithOffsets(
  raw: string,
  options: ExtractUspsOptions = {},
): ExtractedUspsSection[] {
  const results: ExtractedUspsSection[] = [];
  const searchableRaw = stripFencedCodeBlocks(raw);

  if (!searchableRaw) {
    return results;
  }

  const normalizedCitySlug = options.citySlug
    ? normalizeUspsCitySlug(options.citySlug)
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
    const citySlug = extractUspsCitySlugFromOpeningTag(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!citySlug) {
      index = tagEnd + 1;
      continue;
    }

    sectionOrdinal += 1;

    const matchesCitySlug =
      normalizedCitySlug === undefined || citySlug === normalizedCitySlug;

    if (!matchesCitySlug) {
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
        citySlug,
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
      citySlug,
      mdx: searchableRaw.slice(openIndex, endIndex),
      offset: openIndex,
      sectionOrdinal,
    });
    index = endIndex;
  }

  return results;
}

export function getUspsSections(
  citySlug: string,
  posts: PostSource[] = allPosts,
): UspsSection[] {
  const normalizedCitySlug = normalizeUspsCitySlug(citySlug);
  if (!normalizedCitySlug) {
    return [];
  }

  const extracted: UspsSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractUspsSectionsWithOffsets(raw, {
      citySlug: normalizedCitySlug,
    });

    for (const section of sections) {
      extracted.push(toUspsSection(post, section));
    }
  }

  return extracted
    .sort(compareUspsSectionsByDateAsc)
    .map(({ offset: _offset, ...section }) => section);
}

export async function getUspsNarrativeDays(
  citySlug: string,
  posts: PostSource[] = allPosts,
): Promise<UspsNarrativeDay[]> {
  const normalizedCitySlug = normalizeUspsCitySlug(citySlug);
  if (!normalizedCitySlug) {
    return [];
  }

  const visitDays = await listUspsDaysFromDb(normalizedCitySlug);

  if (visitDays.length === 0) {
    return [];
  }

  const sections = getUspsSections(normalizedCitySlug, posts);
  const sectionsByDay = new Map<string, UspsSection[]>();
  const sourcePostsByDay = new Map<string, UspsSourcePost[]>();

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

export async function listUspsSummaries(): Promise<UspsSummary[]> {
  return listUspsSummariesFromDb();
}

export async function getUspsPageData(
  citySlug: string,
  posts: PostSource[] = allPosts,
): Promise<UspsPageData | null> {
  const normalizedCitySlug = normalizeUspsCitySlug(citySlug);
  if (!normalizedCitySlug) {
    return null;
  }

  const [summary, days] = await Promise.all([
    getUspsSummaryFromDb(normalizedCitySlug),
    getUspsNarrativeDays(normalizedCitySlug, posts),
  ]);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    days,
  };
}
