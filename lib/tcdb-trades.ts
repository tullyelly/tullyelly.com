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
  status: "Open" | "Completed";
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
const TRADE_PARTNER_ATTR = /tcdbTradePartner="([^"]+)"/;
const TRADE_RECEIVED_ATTR =
  /(?:^|\s)received=(?:\{\s*(\d+)\s*\}|"(\d+)"|'(\d+)')/;
const TRADE_SENT_OUT_ATTR =
  /(?:^|\s)sentOut=(?:\{\s*(\d+)\s*\}|"(\d+)"|'(\d+)')/;

type TradeSummaryAccumulator = {
  startDate?: string;
  endDate?: string;
  partner?: string;
  received?: number;
  receivedDate?: string;
  receivedOffset?: number;
  sent?: number;
  sentDate?: string;
  sentOffset?: number;
};

type ExtractedTradeTag = {
  tradeId: string;
  partner?: string;
  completed: boolean;
  received?: number;
  sent?: number;
  offset: number;
};

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

const extractNumericTradeAttr = (
  openingTag: string,
  pattern: RegExp,
): number | undefined => {
  const match = openingTag.match(pattern);
  const rawValue = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!rawValue) return undefined;

  const value = Number.parseInt(rawValue, 10);
  return Number.isNaN(value) ? undefined : value;
};

const isEarlierDate = (candidate: string, existing?: string): boolean => {
  if (!existing) return true;

  const diff = toTimestamp(candidate) - toTimestamp(existing);
  if (diff !== 0) return diff < 0;
  return candidate < existing;
};

const isLaterDate = (candidate: string, existing?: string): boolean => {
  if (!existing) return true;

  const diff = toTimestamp(candidate) - toTimestamp(existing);
  if (diff !== 0) return diff > 0;
  return candidate > existing;
};

const shouldUseLaterTradeValue = (
  candidateDate: string,
  candidateOffset: number,
  existingDate?: string,
  existingOffset?: number,
): boolean => {
  if (!existingDate) return true;

  const diff = toTimestamp(candidateDate) - toTimestamp(existingDate);
  if (diff !== 0) return diff > 0;
  return candidateOffset > (existingOffset ?? -1);
};

const applyTradeCardCounts = (
  trade: TradeSummaryAccumulator,
  tag: ExtractedTradeTag,
  postDate: string,
) => {
  if (
    tag.received !== undefined &&
    shouldUseLaterTradeValue(
      postDate,
      tag.offset,
      trade.receivedDate,
      trade.receivedOffset,
    )
  ) {
    trade.received = tag.received;
    trade.receivedDate = postDate;
    trade.receivedOffset = tag.offset;
  }

  if (
    tag.sent !== undefined &&
    shouldUseLaterTradeValue(
      postDate,
      tag.offset,
      trade.sentDate,
      trade.sentOffset,
    )
  ) {
    trade.sent = tag.sent;
    trade.sentDate = postDate;
    trade.sentOffset = tag.offset;
  }
};

const toTradeCardCounts = (
  received?: number,
  sent?: number,
): TcdbTradeCardCounts => {
  const counts: TcdbTradeCardCounts = {};

  if (received !== undefined) {
    counts.received = received;
  }

  if (sent !== undefined) {
    counts.sent = sent;
  }

  if (received !== undefined || sent !== undefined) {
    counts.total = (received ?? 0) + (sent ?? 0);
  }

  return counts;
};

const extractTradeTags = (raw: string): ExtractedTradeTag[] => {
  const tags: ExtractedTradeTag[] = [];
  if (!raw) return tags;

  let index = 0;

  while (index < raw.length) {
    const openIndex = raw.indexOf(RELEASE_SECTION_OPEN, index);
    if (openIndex === -1) break;

    const tagEnd = raw.indexOf(">", openIndex + RELEASE_SECTION_OPEN.length);
    if (tagEnd === -1) break;

    const openingTag = raw.slice(openIndex, tagEnd + 1);
    const tradeId = openingTag.match(TRADE_ID_ATTR)?.[1];

    if (tradeId) {
      const partner = openingTag.match(TRADE_PARTNER_ATTR)?.[1];
      const received = extractNumericTradeAttr(openingTag, TRADE_RECEIVED_ATTR);
      const sent = extractNumericTradeAttr(openingTag, TRADE_SENT_OUT_ATTR);
      tags.push({
        tradeId,
        partner,
        completed: hasCompletedAttr(openingTag),
        received,
        sent,
        offset: openIndex,
      });
    }

    index = tagEnd + 1;
  }

  return tags;
};

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

export function getTcdbTradeCardCounts(
  tradeId: string,
  posts: PostSource[] = allPosts,
): TcdbTradeCardCounts {
  if (!tradeId) return {};

  const trade: TradeSummaryAccumulator = {};

  for (const post of posts) {
    const raw = post.body?.raw;
    if (!raw?.includes(TRADE_ID_ATTR_NAME)) continue;

    const tradeTags = extractTradeTags(raw);
    for (const tag of tradeTags) {
      if (tag.tradeId !== tradeId) continue;
      applyTradeCardCounts(trade, tag, post.date);
    }
  }

  return toTradeCardCounts(trade.received, trade.sent);
}

export function listTcdbTrades(): TcdbTradeSummary[] {
  const trades = new Map<string, TradeSummaryAccumulator>();

  for (const post of allPosts) {
    const raw = post.body?.raw;
    if (!raw?.includes(TRADE_ID_ATTR_NAME)) continue;

    const tradeTags = extractTradeTags(raw);
    for (const tag of tradeTags) {
      const current = trades.get(tag.tradeId) ?? {};

      if (!current.partner && tag.partner) {
        current.partner = tag.partner;
      }

      if (tag.completed) {
        if (isLaterDate(post.date, current.endDate)) {
          current.endDate = post.date;
        }
      } else if (isEarlierDate(post.date, current.startDate)) {
        current.startDate = post.date;
      }

      applyTradeCardCounts(current, tag, post.date);
      trades.set(tag.tradeId, current);
    }
  }

  return Array.from(trades.entries())
    .map(([tradeId, trade]) => {
      const counts = toTradeCardCounts(trade.received, trade.sent);
      const summary: TcdbTradeSummary = {
        ...counts,
        tradeId,
        startDate: trade.startDate ?? trade.endDate ?? "",
        status: trade.endDate ? "Completed" : "Open",
      };

      if (trade.endDate) summary.endDate = trade.endDate;
      if (trade.partner) summary.partner = trade.partner;

      return summary;
    })
    .sort((a, b) => Number(b.tradeId) - Number(a.tradeId));
}
