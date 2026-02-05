import "server-only";
import { allPosts } from "contentlayer/generated";

export type TradeSectionKind = "original" | "completed";

export type TradeSection = {
  kind: TradeSectionKind;
  postSlug: string;
  postUrl: string;
  postDate: string;
  mdx: string;
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
};

type ExtractedSection = {
  kind: TradeSectionKind;
  mdx: string;
  offset: number;
};

const RELEASE_SECTION_OPEN = "<ReleaseSection";
const RELEASE_SECTION_CLOSE = "</ReleaseSection>";
const COMPLETED_ATTR = /(^|\s)completed(\s|=|>|\/)/;
const TRADE_ID_ATTR_NAME = "tcdbTradeId";
const TRADE_ID_ATTR = new RegExp(`${TRADE_ID_ATTR_NAME}="([^"]+)"`);

export const getTradeIdAttribute = (tradeId: string): string =>
  `${TRADE_ID_ATTR_NAME}="${tradeId}"`;

const toTimestamp = (value: string): number => {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const compareByDateAsc = (
  a: ExtractedSection & TradeSection,
  b: ExtractedSection & TradeSection,
) => {
  const diff = toTimestamp(a.postDate) - toTimestamp(b.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const compareByDateDesc = (
  a: ExtractedSection & TradeSection,
  b: ExtractedSection & TradeSection,
) => {
  const diff = toTimestamp(b.postDate) - toTimestamp(a.postDate);
  if (diff !== 0) return diff;
  const slugDiff = a.postSlug.localeCompare(b.postSlug);
  if (slugDiff !== 0) return slugDiff;
  return a.offset - b.offset;
};

const hasCompletedAttr = (openingTag: string): boolean =>
  COMPLETED_ATTR.test(openingTag);

const extractTradeSectionsWithOffsets = (
  raw: string,
  tradeId: string,
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
    const tradeMatch = openingTag.match(TRADE_ID_ATTR);
    const matchesTrade = tradeMatch?.[1] === tradeId;
    const isSelfClosing = /\/\s*>$/.test(openingTag);

    if (!matchesTrade) {
      index = tagEnd + 1;
      continue;
    }

    const kind: TradeSectionKind = hasCompletedAttr(openingTag)
      ? "completed"
      : "original";

    if (isSelfClosing) {
      results.push({ kind, mdx: openingTag, offset: openIndex });
      index = tagEnd + 1;
      continue;
    }

    const closeIndex = raw.indexOf(RELEASE_SECTION_CLOSE, tagEnd + 1);
    if (closeIndex === -1) break;

    const endIndex = closeIndex + RELEASE_SECTION_CLOSE.length;
    results.push({
      kind,
      mdx: raw.slice(openIndex, endIndex),
      offset: openIndex,
    });
    index = endIndex;
  }

  return results;
};

export const extractTradeSectionsFromRaw = (
  raw: string,
  tradeId: string,
): Array<{ kind: TradeSectionKind; mdx: string }> =>
  extractTradeSectionsWithOffsets(raw, tradeId).map(({ kind, mdx }) => ({
    kind,
    mdx,
  }));

export const getTcdbTradeSections = (
  tradeId: string,
  posts: PostSource[] = allPosts,
): TradeSection[] => {
  if (!tradeId) return [];

  const tradeAttr = getTradeIdAttribute(tradeId);
  const extracted: Array<TradeSection & ExtractedSection> = [];

  for (const post of posts) {
    if (!post.body?.raw?.includes(tradeAttr)) continue;

    const sections = extractTradeSectionsWithOffsets(post.body.raw, tradeId);
    for (const section of sections) {
      extracted.push({
        ...section,
        postSlug: post.slug,
        postUrl: post.url,
        postDate: post.date,
      });
    }
  }

  if (extracted.length === 0) return [];

  const originals = extracted
    .filter((section) => section.kind === "original")
    .sort(compareByDateAsc);
  const completeds = extracted
    .filter((section) => section.kind === "completed")
    .sort(compareByDateDesc);

  return [...originals, ...completeds].map(
    ({ offset: _offset, ...rest }) => rest,
  );
};
