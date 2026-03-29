import "server-only";
import { allPosts } from "contentlayer/generated";
import {
  getTcdbTradeCardCountsFromDb,
  listTcdbTradeDaysFromDb,
  listTcdbTradesFromDb,
  type TcdbTradeDay,
  type TcdbTradeDaySide,
} from "@/lib/tcdb-trade-db";

export type TradeSectionKind = "original" | "completed";

export type TradeSection = {
  kind: TradeSectionKind;
  postSlug: string;
  postUrl: string;
  postDate: string;
  postTitle?: string;
  mdx: string;
};

export type TcdbTradeSourcePost = {
  slug: string;
  url: string;
  date: string;
  title?: string;
};

export type TcdbTradeNarrativeDay = {
  tradeDate: string;
  side: TcdbTradeDaySide;
  sections: TradeSection[];
  sourcePosts: TcdbTradeSourcePost[];
};

export type TcdbTradeCardCounts = {
  received?: number;
  sent?: number;
  total?: number;
};

export type TcdbTradeSummary = TcdbTradeCardCounts & {
  tradeId: string;
  startDate: string;
  endDate?: string;
  partner?: string;
  sectionCount: number;
  status: "Open" | "Completed";
};

type PostSource = {
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
  title?: string;
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

const normalizeTradePostDate = (value: string): string => {
  const trimmed = value.trim();
  const leadingDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return leadingDate?.[1] ?? trimmed;
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

function getResolvedTradeSectionKind(
  fallbackKind: TradeSectionKind,
  sideByDate: Map<string, "sent" | "received">,
  tradeDate: string,
): TradeSectionKind {
  const side = sideByDate.get(tradeDate);

  if (side === "received") {
    return "completed";
  }

  if (side === "sent") {
    return "original";
  }

  return fallbackKind;
}

function getTradeDayKey(
  tradeDate: string,
  side: TcdbTradeDaySide,
): `${TcdbTradeDaySide}:${string}` {
  return `${side}:${tradeDate}`;
}

function collectTcdbTradeSections(
  tradeId: string,
  tradeDays: TcdbTradeDay[],
  posts: PostSource[],
): Array<TradeSection & ExtractedSection> {
  const tradeAttr = getTradeIdAttribute(tradeId);
  const sideByDate = new Map(
    tradeDays.map((tradeDay) => [tradeDay.tradeDate, tradeDay.side]),
  );
  const extracted: Array<TradeSection & ExtractedSection> = [];

  for (const post of posts) {
    if (!post.body?.raw?.includes(tradeAttr)) continue;

    const sections = extractTradeSectionsWithOffsets(post.body.raw, tradeId);
    for (const section of sections) {
      const normalizedPostDate = normalizeTradePostDate(post.date);
      extracted.push({
        ...section,
        kind: getResolvedTradeSectionKind(
          section.kind,
          sideByDate,
          normalizedPostDate,
        ),
        postSlug: post.slug,
        postUrl: post.url,
        postDate: normalizedPostDate,
        ...(post.title ? { postTitle: post.title } : {}),
      });
    }
  }

  return extracted;
}

export const getTcdbTradeSections = async (
  tradeId: string,
  posts: PostSource[] = allPosts,
): Promise<TradeSection[]> => {
  if (!tradeId) return [];

  const tradeDays = await listTcdbTradeDaysFromDb(tradeId);
  const extracted = collectTcdbTradeSections(tradeId, tradeDays, posts);

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

export async function getTcdbTradeNarrativeDays(
  tradeId: string,
  posts: PostSource[] = allPosts,
): Promise<TcdbTradeNarrativeDay[]> {
  if (!tradeId) return [];

  const tradeDays = await listTcdbTradeDaysFromDb(tradeId);
  if (tradeDays.length === 0) return [];

  const extracted = collectTcdbTradeSections(tradeId, tradeDays, posts).sort(
    compareByDateAsc,
  );
  const sectionsByDay = new Map<string, TradeSection[]>();
  const sourcePostsByDay = new Map<string, TcdbTradeSourcePost[]>();

  for (const { offset: _offset, ...section } of extracted) {
    const key = getTradeDayKey(
      section.postDate,
      section.kind === "completed" ? "received" : "sent",
    );

    const sections = sectionsByDay.get(key);
    if (sections) {
      sections.push(section);
    } else {
      sectionsByDay.set(key, [section]);
    }

    const sourcePosts = sourcePostsByDay.get(key) ?? [];
    if (!sourcePosts.some((post) => post.url === section.postUrl)) {
      sourcePosts.push({
        slug: section.postSlug,
        url: section.postUrl,
        date: section.postDate,
        ...(section.postTitle ? { title: section.postTitle } : {}),
      });
      sourcePostsByDay.set(key, sourcePosts);
    }
  }

  return tradeDays.map((tradeDay) => {
    const key = getTradeDayKey(tradeDay.tradeDate, tradeDay.side);
    return {
      tradeDate: tradeDay.tradeDate,
      side: tradeDay.side,
      sections: sectionsByDay.get(key) ?? [],
      sourcePosts: sourcePostsByDay.get(key) ?? [],
    };
  });
}

export function getTcdbProfileUrl(partner: string): string {
  return `https://www.tcdb.com/Profile.cfm/${encodeURIComponent(partner)}`;
}

export async function getTcdbTradeCardCounts(
  tradeId: string,
): Promise<TcdbTradeCardCounts> {
  if (!tradeId) return {};

  return getTcdbTradeCardCountsFromDb(tradeId);
}

export async function listTcdbTrades(): Promise<TcdbTradeSummary[]> {
  return listTcdbTradesFromDb();
}
