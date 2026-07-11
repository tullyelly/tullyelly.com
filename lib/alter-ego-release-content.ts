import "server-only";

import { allPosts } from "contentlayer/generated";

import type { PersonaReleaseFeed } from "@/lib/persona-release-feeds";
import type { PersonaReleaseOrder } from "@/lib/persona-release-feeds";

export const PERSONA_RELEASE_LANDING_LIMIT = 10;
export const PERSONA_RELEASE_PAGE_SIZE = 20;

export type ReleasePostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
  tags?: readonly string[];
  draft?: boolean;
};

export type ExtractedReleaseSection = {
  alterEgo: string;
  mdx: string;
  bodyMdx: string;
  offset: number;
  sectionOrdinal: number;
  totalSections: number;
  sourceColourKey: string;
};

export type AlterEgoReleaseEntry = ExtractedReleaseSection & {
  postSlug: string;
  postUrl: string;
  postTitle: string;
  postDate: string;
  postTags: readonly string[];
};

export type ReleasePageResult = {
  entries: AlterEgoReleaseEntry[];
  page: number;
  pageCount: number;
  total: number;
  outOfRange: boolean;
};

const OPEN = "<ReleaseSection";
const CLOSE = "</ReleaseSection>";
const ALTER_EGO_ATTRIBUTE =
  /(?:^|\s)alterEgo\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*"([^"]+)"\s*\}|\{\s*'([^']+)'\s*\})/;

function maskFencedCode(source: string): string {
  const chars = [...source];
  const fence = /(^|\n)([ \t]*)(`{3,}|~{3,})[^\n]*(?:\n|$)/g;
  let match: RegExpExecArray | null;
  let active: { marker: string; start: number } | null = null;

  while ((match = fence.exec(source))) {
    const marker = match[3][0];
    const length = match[3].length;
    if (!active) {
      active = { marker, start: match.index + (match[1]?.length ?? 0) };
    } else if (marker === active.marker && length >= 3) {
      const end = fence.lastIndex;
      for (let index = active.start; index < end; index += 1) {
        if (chars[index] !== "\n") chars[index] = " ";
      }
      active = null;
    }
  }

  if (active) {
    for (let index = active.start; index < chars.length; index += 1) {
      if (chars[index] !== "\n") chars[index] = " ";
    }
  }
  return chars.join("");
}

function findOpeningTagEnd(source: string, start: number): number {
  let quote: "\"" | "'" | null = null;
  let braceDepth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "{") braceDepth += 1;
    else if (char === "}") braceDepth = Math.max(0, braceDepth - 1);
    else if (char === ">" && braceDepth === 0) return index;
  }
  return -1;
}

function attributeAlterEgo(openingTag: string): string | null {
  const match = openingTag.match(ALTER_EGO_ATTRIBUTE);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? match?.[4] ?? null;
}

export function extractReleaseSections(raw: string): ExtractedReleaseSection[] {
  const searchable = maskFencedCode(raw);
  const preliminary: Omit<ExtractedReleaseSection, "totalSections" | "sourceColourKey">[] = [];
  let cursor = 0;
  let ordinal = 0;

  while (cursor < searchable.length) {
    const start = searchable.indexOf(OPEN, cursor);
    if (start < 0) break;
    const boundary = searchable[start + OPEN.length];
    if (boundary && /[A-Za-z0-9_$]/.test(boundary)) {
      cursor = start + OPEN.length;
      continue;
    }
    const tagEnd = findOpeningTagEnd(searchable, start + OPEN.length);
    if (tagEnd < 0) break;
    const openingTag = raw.slice(start, tagEnd + 1);
    const alterEgo = attributeAlterEgo(openingTag);
    ordinal += 1;
    const selfClosing = /\/\s*>$/.test(openingTag);
    if (selfClosing) {
      if (alterEgo) preliminary.push({ alterEgo, mdx: raw.slice(start, tagEnd + 1), bodyMdx: "", offset: start, sectionOrdinal: ordinal });
      cursor = tagEnd + 1;
      continue;
    }

    let depth = 1;
    let searchAt = tagEnd + 1;
    let end = -1;
    let closeStart = -1;
    while (depth > 0) {
      const nextOpen = searchable.indexOf(OPEN, searchAt);
      const nextClose = searchable.indexOf(CLOSE, searchAt);
      if (nextClose < 0) break;
      if (nextOpen >= 0 && nextOpen < nextClose) {
        const nestedEnd = findOpeningTagEnd(searchable, nextOpen + OPEN.length);
        if (nestedEnd < 0) break;
        if (!/\/\s*>$/.test(searchable.slice(nextOpen, nestedEnd + 1))) depth += 1;
        searchAt = nestedEnd + 1;
      } else {
        depth -= 1;
        closeStart = nextClose;
        end = nextClose + CLOSE.length;
        searchAt = end;
      }
    }
    if (depth > 0 || end < 0) break;
    if (alterEgo) preliminary.push({ alterEgo, mdx: raw.slice(start, end), bodyMdx: raw.slice(tagEnd + 1, closeStart), offset: start, sectionOrdinal: ordinal });
    cursor = end;
  }

  return preliminary.map((section) => ({ ...section, totalSections: ordinal, sourceColourKey: raw }));
}

const timestamp = (date: string) => {
  const value = new Date(date).getTime();
  return Number.isNaN(value) ? 0 : value;
};

export function compareReleaseEntriesNewestFirst(a: AlterEgoReleaseEntry, b: AlterEgoReleaseEntry): number {
  return timestamp(b.postDate) - timestamp(a.postDate) ||
    b.sectionOrdinal - a.sectionOrdinal ||
    a.postSlug.localeCompare(b.postSlug) ||
    b.offset - a.offset;
}

export function getAlterEgoReleaseEntries(
  alterEgo: PersonaReleaseFeed,
  posts: readonly ReleasePostSource[] = allPosts,
): AlterEgoReleaseEntry[] {
  return posts
    .filter((post) => !post.draft)
    .flatMap((post) => extractReleaseSections(post.body?.raw ?? "")
      .filter((section) => section.alterEgo === alterEgo)
      .map((section) => ({ ...section, postSlug: post.slug, postUrl: post.url || `/shaolin/${post.slug}`, postTitle: post.title ?? post.slug, postDate: post.date, postTags: post.tags ?? [] })))
    .sort(compareReleaseEntriesNewestFirst);
}

export function getLandingReleaseEntries(alterEgo: PersonaReleaseFeed, posts?: readonly ReleasePostSource[]) {
  return getAlterEgoReleaseEntries(alterEgo, posts).slice(0, PERSONA_RELEASE_LANDING_LIMIT);
}

export function normalizeReleasePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function normalizeReleaseOrder(
  value: string | string[] | undefined,
): PersonaReleaseOrder {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "oldest" ? "oldest" : "newest";
}

export function orderReleaseEntries(
  entries: AlterEgoReleaseEntry[],
  order: PersonaReleaseOrder,
): AlterEgoReleaseEntry[] {
  return order === "oldest" ? [...entries].reverse() : entries;
}

export function paginateReleaseEntries(entries: AlterEgoReleaseEntry[], requestedPage: number): ReleasePageResult {
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const total = entries.length;
  const pageCount = Math.max(1, Math.ceil(total / PERSONA_RELEASE_PAGE_SIZE));
  const outOfRange = total > 0 && page > pageCount;
  const start = (page - 1) * PERSONA_RELEASE_PAGE_SIZE;
  return { entries: outOfRange ? [] : entries.slice(start, start + PERSONA_RELEASE_PAGE_SIZE), page, pageCount, total, outOfRange };
}

export function getReleasePageDateRange(
  entries: readonly AlterEgoReleaseEntry[],
): { start: string; end: string } | null {
  if (entries.length === 0) return null;
  const dates = entries.map((entry) => entry.postDate.slice(0, 10)).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

export function releaseSectionPreview(bodyMdx: string, limit = 240): string {
  let text = bodyMdx
    .replace(/(^|\n)[ \t]*(`{3,}|~{3,})[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/[`*_~>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  text = text.slice(0, limit + 1);
  const boundary = text.lastIndexOf(" ");
  return `${text.slice(0, boundary > 0 ? boundary : limit).trim()}…`;
}
