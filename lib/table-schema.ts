import "server-only";
import { allPosts } from "contentlayer/generated";

export type TableSchemaSection = {
  tableSchemaId: string;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle: string;
  tableSchemaName?: string;
  tableSchemaRating?: string;
  mdx: string;
};

export type TableSchemaSummary = {
  tableSchemaId: string;
  tableSchemaName: string;
  averageRating: number;
  latestPostDate: string;
};

export type TableSchemaPageData = {
  tableSchemaId: string;
  tableSchemaName: string;
  summary: {
    averageRating: number;
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
  tableSchemaRating?: string;
};

type TableSchemaSectionWithOffset = TableSchemaSection & { offset: number };

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const TABLE_SCHEMA_ID_ATTR_NAME = "tableSchemaId";
const TABLE_SCHEMA_ID_BRACED_ATTR = new RegExp(
  `${TABLE_SCHEMA_ID_ATTR_NAME}\\s*=\\s*\\{\\s*["']?([^"'\\s}]+)["']?\\s*\\}`,
);
const TABLE_SCHEMA_ID_DOUBLE_QUOTED_ATTR = new RegExp(
  `${TABLE_SCHEMA_ID_ATTR_NAME}\\s*=\\s*"([^"]+)"`,
);
const TABLE_SCHEMA_ID_SINGLE_QUOTED_ATTR = new RegExp(
  `${TABLE_SCHEMA_ID_ATTR_NAME}\\s*=\\s*'([^']+)'`,
);
const TABLE_SCHEMA_NAME_DOUBLE_QUOTED_ATTR =
  /tableSchemaName\s*=\s*"([^"]+)"/;
const TABLE_SCHEMA_NAME_SINGLE_QUOTED_ATTR =
  /tableSchemaName\s*=\s*'([^']+)'/;
const TABLE_SCHEMA_NAME_BRACED_QUOTED_ATTR =
  /tableSchemaName\s*=\s*\{\s*["']([^"']+)["']\s*\}/;
const TABLE_SCHEMA_NAME_BRACED_ATTR =
  /tableSchemaName\s*=\s*\{\s*([^}"'\s][^}]*)\s*\}/;
const TABLE_SCHEMA_RATING_DOUBLE_QUOTED_ATTR =
  /tableSchemaRating\s*=\s*"([^"]+)"/;
const TABLE_SCHEMA_RATING_SINGLE_QUOTED_ATTR =
  /tableSchemaRating\s*=\s*'([^']+)'/;
const TABLE_SCHEMA_RATING_BRACED_QUOTED_ATTR =
  /tableSchemaRating\s*=\s*\{\s*["']([^"']+)["']\s*\}/;
const TABLE_SCHEMA_RATING_BRACED_ATTR =
  /tableSchemaRating\s*=\s*\{\s*([^}"'\s][^}]*)\s*\}/;
const TABLE_SCHEMA_RATING_PATTERN =
  /^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?\s*$/;

const normalizeTableSchemaId = (value: string | number): string =>
  String(value).trim();

export const getTableSchemaIdAttribute = (tableSchemaId: string | number) =>
  `${TABLE_SCHEMA_ID_ATTR_NAME}={${normalizeTableSchemaId(tableSchemaId)}}`;

const extractTableSchemaId = (openingTag: string): string | undefined => {
  const braced = openingTag.match(TABLE_SCHEMA_ID_BRACED_ATTR)?.[1];
  if (braced) return normalizeTableSchemaId(braced);

  const doubleQuoted = openingTag.match(TABLE_SCHEMA_ID_DOUBLE_QUOTED_ATTR)?.[1];
  if (doubleQuoted) return normalizeTableSchemaId(doubleQuoted);

  const singleQuoted = openingTag.match(TABLE_SCHEMA_ID_SINGLE_QUOTED_ATTR)?.[1];
  if (singleQuoted) return normalizeTableSchemaId(singleQuoted);

  return undefined;
};

const extractTableSchemaName = (openingTag: string): string | undefined => {
  const bracedQuoted = openingTag.match(TABLE_SCHEMA_NAME_BRACED_QUOTED_ATTR)?.[1];
  if (bracedQuoted?.trim()) return bracedQuoted.trim();

  const doubleQuoted = openingTag.match(TABLE_SCHEMA_NAME_DOUBLE_QUOTED_ATTR)?.[1];
  if (doubleQuoted?.trim()) return doubleQuoted.trim();

  const singleQuoted = openingTag.match(TABLE_SCHEMA_NAME_SINGLE_QUOTED_ATTR)?.[1];
  if (singleQuoted?.trim()) return singleQuoted.trim();

  const braced = openingTag.match(TABLE_SCHEMA_NAME_BRACED_ATTR)?.[1];
  if (braced?.trim()) return braced.trim();

  return undefined;
};

const extractTableSchemaRating = (openingTag: string): string | undefined => {
  const bracedQuoted = openingTag.match(
    TABLE_SCHEMA_RATING_BRACED_QUOTED_ATTR,
  )?.[1];
  if (bracedQuoted?.trim()) return bracedQuoted.trim();

  const doubleQuoted = openingTag.match(
    TABLE_SCHEMA_RATING_DOUBLE_QUOTED_ATTR,
  )?.[1];
  if (doubleQuoted?.trim()) return doubleQuoted.trim();

  const singleQuoted = openingTag.match(
    TABLE_SCHEMA_RATING_SINGLE_QUOTED_ATTR,
  )?.[1];
  if (singleQuoted?.trim()) return singleQuoted.trim();

  const braced = openingTag.match(TABLE_SCHEMA_RATING_BRACED_ATTR)?.[1];
  if (braced?.trim()) return braced.trim();

  return undefined;
};

const parseTableSchemaRating = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const match = value.match(TABLE_SCHEMA_RATING_PATTERN);
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
  a: TableSchemaSectionWithOffset,
  b: TableSchemaSectionWithOffset,
) => {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const compareTableSchemaIds = (a: string, b: string): number => {
  const aAsNumber = Number(a);
  const bAsNumber = Number(b);
  const bothNumeric = !Number.isNaN(aAsNumber) && !Number.isNaN(bAsNumber);
  if (bothNumeric) return aAsNumber - bAsNumber;
  return a.localeCompare(b);
};

const compareTableSchemaSummaryDesc = (
  a: TableSchemaSummary,
  b: TableSchemaSummary,
): number => {
  const dateDiff = toTimestamp(b.latestPostDate) - toTimestamp(a.latestPostDate);
  if (dateDiff !== 0) return dateDiff;
  return compareTableSchemaIds(b.tableSchemaId, a.tableSchemaId);
};

export const extractTableSchemaSectionsWithOffsets = (
  raw: string,
  tableSchemaId?: string,
): ExtractedTableSchemaSection[] => {
  const results: ExtractedTableSchemaSection[] = [];
  if (!raw) return results;

  let index = 0;

  while (index < raw.length) {
    const openIndex = raw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) break;

    const tagEnd = raw.indexOf(">", openIndex + RELEASE_SECTION_OPEN.length);
    if (tagEnd === -1) break;

    const openingTag = raw.slice(openIndex, tagEnd + 1);
    const matchingTableSchemaId = extractTableSchemaId(openingTag);
    const tableSchemaName = extractTableSchemaName(openingTag);
    const tableSchemaRating = extractTableSchemaRating(openingTag);
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!matchingTableSchemaId) {
      index = tagEnd + 1;
      continue;
    }

    if (tableSchemaId && matchingTableSchemaId !== tableSchemaId) {
      index = tagEnd + 1;
      continue;
    }

    if (isSelfClosing) {
      results.push({
        mdx: openingTag,
        offset: openIndex,
        tableSchemaId: matchingTableSchemaId,
        tableSchemaName,
        tableSchemaRating,
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
      tableSchemaId: matchingTableSchemaId,
      tableSchemaName,
      tableSchemaRating,
    });
    index = endIndex;
  }

  return results;
};

export const getTableSchemaSections = (
  tableSchemaId: string | number,
  posts: PostSource[] = allPosts,
): TableSchemaSection[] => {
  const normalizedTableSchemaId = normalizeTableSchemaId(tableSchemaId);
  if (!normalizedTableSchemaId) return [];

  const extracted: TableSchemaSectionWithOffset[] = [];

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractTableSchemaSectionsWithOffsets(
      raw,
      normalizedTableSchemaId,
    );

    for (const section of sections) {
      extracted.push({
        ...section,
        tableSchemaId: section.tableSchemaId,
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

export const summarizeTableSchemaSections = (
  sections: TableSchemaSection[],
): { tableSchemaName?: string; averageRating: number } => {
  const tableSchemaName = sections
    .map((section) => section.tableSchemaName?.trim())
    .find((name): name is string => Boolean(name));

  let total = 0;
  let count = 0;

  for (const section of sections) {
    const parsed = parseTableSchemaRating(section.tableSchemaRating);
    if (parsed === undefined) continue;

    total += parsed;
    count += 1;
  }

  const averageRating =
    count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  return {
    tableSchemaName,
    averageRating,
  };
};

export const getAllTableSchemaSummaries = (
  posts: PostSource[] = allPosts,
): TableSchemaSummary[] => {
  const byTableSchema = new Map<string, TableSchemaSectionWithOffset[]>();

  for (const post of posts) {
    const raw = post.body?.raw ?? "";
    const sections = extractTableSchemaSectionsWithOffsets(raw);

    for (const section of sections) {
      const tableSchemaSections = byTableSchema.get(section.tableSchemaId) ?? [];
      tableSchemaSections.push({
        ...section,
        tableSchemaId: section.tableSchemaId,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
        postTitle: post.title ?? post.slug,
      });
      byTableSchema.set(section.tableSchemaId, tableSchemaSections);
    }
  }

  if (byTableSchema.size === 0) return [];

  const summaries: TableSchemaSummary[] = [];
  for (const [tableSchemaId, sections] of byTableSchema.entries()) {
    const orderedSections = [...sections].sort(compareByDateAsc);
    const summary = summarizeTableSchemaSections(orderedSections);
    const latestPostDate =
      orderedSections[orderedSections.length - 1]?.postDate ?? "";

    summaries.push({
      tableSchemaId,
      tableSchemaName:
        summary.tableSchemaName ?? `Table Schema ${tableSchemaId}`,
      averageRating: summary.averageRating,
      latestPostDate,
    });
  }

  return summaries.sort(compareTableSchemaSummaryDesc);
};

export const getTableSchemaPageData = (
  tableSchemaId: string | number,
  posts: PostSource[] = allPosts,
): TableSchemaPageData | null => {
  const normalizedTableSchemaId = normalizeTableSchemaId(tableSchemaId);
  if (!normalizedTableSchemaId) return null;

  const sections = getTableSchemaSections(normalizedTableSchemaId, posts);
  if (sections.length === 0) return null;

  const summary = summarizeTableSchemaSections(sections);

  return {
    tableSchemaId: normalizedTableSchemaId,
    tableSchemaName:
      summary.tableSchemaName ?? `Table Schema ${normalizedTableSchemaId}`,
    summary: {
      averageRating: summary.averageRating,
    },
    sections,
  };
};
