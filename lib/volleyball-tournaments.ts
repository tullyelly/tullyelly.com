import "server-only";
import { allPosts } from "contentlayer/generated";

export type TournamentSection = {
  tournamentId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  tournamentName?: string;
  tournamentRecord?: string;
  mdx: string;
};

export type TournamentSummary = {
  tournamentName?: string;
  overallWins: number;
  overallLosses: number;
  overallRecord: string;
};

export type VolleyballTournamentSummary = {
  tournamentId: string;
  tournamentName: string;
  overallWins: number;
  overallLosses: number;
  overallRecord: string;
  tournamentDays: number;
  latestPostDate: string;
};

export type VolleyballTournamentPageData = {
  tournamentId: string;
  tournamentName: string;
  summary: TournamentSummary;
  sections: TournamentSection[];
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
};

type ExtractedSection = {
  mdx: string;
  offset: number;
  tournamentId: string;
  tournamentName?: string;
  tournamentRecord?: string;
};

type TournamentSectionWithOffset = TournamentSection & { offset: number };

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const TOURNAMENT_ID_ATTR_NAME = "tournamentId";
const TOURNAMENT_ID_BRACED_ATTR = new RegExp(
  `${TOURNAMENT_ID_ATTR_NAME}\\s*=\\s*\\{\\s*["']?([^"'\\s}]+)["']?\\s*\\}`,
);
const TOURNAMENT_ID_DOUBLE_QUOTED_ATTR = new RegExp(
  `${TOURNAMENT_ID_ATTR_NAME}\\s*=\\s*"([^"]+)"`,
);
const TOURNAMENT_ID_SINGLE_QUOTED_ATTR = new RegExp(
  `${TOURNAMENT_ID_ATTR_NAME}\\s*=\\s*'([^']+)'`,
);
const TOURNAMENT_NAME_DOUBLE_QUOTED_ATTR = /tournamentName\s*=\s*"([^"]+)"/;
const TOURNAMENT_NAME_SINGLE_QUOTED_ATTR = /tournamentName\s*=\s*'([^']+)'/;
const TOURNAMENT_NAME_BRACED_QUOTED_ATTR =
  /tournamentName\s*=\s*\{\s*["']([^"']+)["']\s*\}/;
const TOURNAMENT_RECORD_DOUBLE_QUOTED_ATTR =
  /tournamentRecord\s*=\s*"([^"]+)"/;
const TOURNAMENT_RECORD_SINGLE_QUOTED_ATTR =
  /tournamentRecord\s*=\s*'([^']+)'/;
const TOURNAMENT_RECORD_BRACED_QUOTED_ATTR =
  /tournamentRecord\s*=\s*\{\s*["']([^"']+)["']\s*\}/;
const TOURNAMENT_RECORD_PATTERN = /^\s*(\d+)\s*[-–—]\s*(\d+)\s*$/;

const normalizeTournamentId = (value: string | number): string =>
  String(value).trim();

export const getTournamentIdAttribute = (tournamentId: string | number) =>
  `${TOURNAMENT_ID_ATTR_NAME}={${normalizeTournamentId(tournamentId)}}`;

const extractTournamentId = (openingTag: string): string | undefined => {
  const braced = openingTag.match(TOURNAMENT_ID_BRACED_ATTR)?.[1];
  if (braced) return normalizeTournamentId(braced);

  const doubleQuoted = openingTag.match(TOURNAMENT_ID_DOUBLE_QUOTED_ATTR)?.[1];
  if (doubleQuoted) return normalizeTournamentId(doubleQuoted);

  const singleQuoted = openingTag.match(TOURNAMENT_ID_SINGLE_QUOTED_ATTR)?.[1];
  if (singleQuoted) return normalizeTournamentId(singleQuoted);

  return undefined;
};

const extractTournamentName = (openingTag: string): string | undefined => {
  const bracedQuoted = openingTag.match(TOURNAMENT_NAME_BRACED_QUOTED_ATTR)?.[1];
  if (bracedQuoted?.trim()) return bracedQuoted.trim();

  const doubleQuoted = openingTag.match(TOURNAMENT_NAME_DOUBLE_QUOTED_ATTR)?.[1];
  if (doubleQuoted?.trim()) return doubleQuoted.trim();

  const singleQuoted = openingTag.match(TOURNAMENT_NAME_SINGLE_QUOTED_ATTR)?.[1];
  if (singleQuoted?.trim()) return singleQuoted.trim();

  return undefined;
};

const extractTournamentRecord = (openingTag: string): string | undefined => {
  const bracedQuoted = openingTag.match(TOURNAMENT_RECORD_BRACED_QUOTED_ATTR)?.[1];
  if (bracedQuoted?.trim()) return bracedQuoted.trim();

  const doubleQuoted = openingTag.match(TOURNAMENT_RECORD_DOUBLE_QUOTED_ATTR)?.[1];
  if (doubleQuoted?.trim()) return doubleQuoted.trim();

  const singleQuoted = openingTag.match(TOURNAMENT_RECORD_SINGLE_QUOTED_ATTR)?.[1];
  if (singleQuoted?.trim()) return singleQuoted.trim();

  return undefined;
};

const parseTournamentRecord = (
  record: string | undefined,
): { wins: number; losses: number } | undefined => {
  if (!record) return undefined;
  const match = record.match(TOURNAMENT_RECORD_PATTERN);
  if (!match) return undefined;

  const wins = Number.parseInt(match[1] ?? "", 10);
  const losses = Number.parseInt(match[2] ?? "", 10);
  if (Number.isNaN(wins) || Number.isNaN(losses)) return undefined;

  return { wins, losses };
};

const toTimestamp = (value: string): number => {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const compareByDateAsc = (
  a: TournamentSectionWithOffset,
  b: TournamentSectionWithOffset,
) => {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const compareTournamentIds = (a: string, b: string): number => {
  const aAsNumber = Number(a);
  const bAsNumber = Number(b);
  const bothNumeric = !Number.isNaN(aAsNumber) && !Number.isNaN(bAsNumber);
  if (bothNumeric) return aAsNumber - bAsNumber;
  return a.localeCompare(b);
};

const compareTournamentSummaryDesc = (
  a: VolleyballTournamentSummary,
  b: VolleyballTournamentSummary,
): number => {
  const dateDiff = toTimestamp(b.latestPostDate) - toTimestamp(a.latestPostDate);
  if (dateDiff !== 0) return dateDiff;
  return compareTournamentIds(b.tournamentId, a.tournamentId);
};

const extractTournamentSectionsWithOffsets = (
  raw: string,
  tournamentId?: string,
): ExtractedSection[] => {
  const results: ExtractedSection[] = [];
  if (!raw) return results;

  let index = 0;

  while (index < raw.length) {
    const openIndex = raw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) break;

    const tagEnd = raw.indexOf(">", openIndex + RELEASE_SECTION_OPEN.length);
    if (tagEnd === -1) break;

    const openingTag = raw.slice(openIndex, tagEnd + 1);
    const matchingTournamentId = extractTournamentId(openingTag);
    const tournamentName = extractTournamentName(openingTag);
    const tournamentRecord = extractTournamentRecord(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!matchingTournamentId) {
      index = tagEnd + 1;
      continue;
    }

    if (tournamentId && matchingTournamentId !== tournamentId) {
      index = tagEnd + 1;
      continue;
    }

    if (isSelfClosing) {
      results.push({
        mdx: openingTag,
        offset: openIndex,
        tournamentId: matchingTournamentId,
        tournamentName,
        tournamentRecord,
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
      tournamentId: matchingTournamentId,
      tournamentName,
      tournamentRecord,
    });
    index = endIndex;
  }

  return results;
};

export const extractTournamentSectionsFromRaw = (
  raw: string,
  tournamentId: string | number,
): Array<{ mdx: string }> => {
  const normalizedTournamentId = normalizeTournamentId(tournamentId);
  if (!normalizedTournamentId) return [];

  return extractTournamentSectionsWithOffsets(raw, normalizedTournamentId).map(
    ({ mdx }) => ({ mdx }),
  );
};

export const getVolleyballTournamentSections = (
  tournamentId: string | number,
  posts: PostSource[] = allPosts,
): TournamentSection[] => {
  const normalizedTournamentId = normalizeTournamentId(tournamentId);
  if (!normalizedTournamentId) return [];

  const extracted: TournamentSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractTournamentSectionsWithOffsets(
      raw,
      normalizedTournamentId,
    );

    for (const section of sections) {
      extracted.push({
        ...section,
        tournamentId: section.tournamentId,
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

export const getAllVolleyballTournamentSummaries = (
  posts: PostSource[] = allPosts,
): VolleyballTournamentSummary[] => {
  const byTournament = new Map<string, TournamentSectionWithOffset[]>();

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractTournamentSectionsWithOffsets(raw);

    for (const section of sections) {
      const tournamentSections = byTournament.get(section.tournamentId) ?? [];
      tournamentSections.push({
        ...section,
        tournamentId: section.tournamentId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
      byTournament.set(section.tournamentId, tournamentSections);
    }
  }

  if (byTournament.size === 0) return [];

  const summaries: VolleyballTournamentSummary[] = [];
  for (const [tournamentId, sections] of byTournament.entries()) {
    const orderedSections = [...sections].sort(compareByDateAsc);
    const summary = summarizeTournamentSections(orderedSections);
    const latestPostDate =
      orderedSections[orderedSections.length - 1]?.postDate ?? "";
    const tournamentDays = new Set(
      orderedSections.map((section) => section.postDate),
    ).size;

    summaries.push({
      tournamentId,
      tournamentName:
        summary.tournamentName ?? `Volleyball Tournament ${tournamentId}`,
      overallWins: summary.overallWins,
      overallLosses: summary.overallLosses,
      overallRecord: summary.overallRecord,
      tournamentDays,
      latestPostDate,
    });
  }

  return summaries.sort(compareTournamentSummaryDesc);
};

export const getVolleyballTournamentPageData = (
  tournamentId: string | number,
  posts: PostSource[] = allPosts,
): VolleyballTournamentPageData | null => {
  const normalizedTournamentId = normalizeTournamentId(tournamentId);
  if (!normalizedTournamentId) return null;

  const sections = getVolleyballTournamentSections(normalizedTournamentId, posts);
  if (sections.length === 0) return null;

  const summary = summarizeTournamentSections(sections);

  return {
    tournamentId: normalizedTournamentId,
    tournamentName:
      summary.tournamentName ?? `Volleyball Tournament ${normalizedTournamentId}`,
    summary,
    sections,
  };
};

export const summarizeTournamentSections = (
  sections: TournamentSection[],
): TournamentSummary => {
  const tournamentName = sections
    .map((section) => section.tournamentName?.trim())
    .find((name): name is string => Boolean(name));

  let overallWins = 0;
  let overallLosses = 0;

  for (const section of sections) {
    const parsed = parseTournamentRecord(section.tournamentRecord);
    if (!parsed) continue;

    overallWins += parsed.wins;
    overallLosses += parsed.losses;
  }

  return {
    tournamentName,
    overallWins,
    overallLosses,
    overallRecord: `${overallWins}-${overallLosses}`,
  };
};
