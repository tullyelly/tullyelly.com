import "server-only";

import { sql } from "@/lib/db";
import type { TcdbTradeSummary } from "@/lib/tcdb-trade-db";

export type TcdbTradePartnerSummary = {
  id: number;
  tcdbUsername: string;
  name?: string;
  cityState?: string;
  country?: string;
  tradeCount: number;
  cardsSent: number;
  cardsReceived: number;
  totalCardsExchanged: number;
  firstTradeDate?: string;
  latestTradeDate?: string;
  hallOfFameCount: number;
};

export type TcdbTradePartnerHomie = {
  id: number;
  name: string;
  tagSlug?: string;
};
export type TcdbTradePartnerClan = {
  id: number;
  name: string;
  slug: string;
  tagSlug?: string;
};
export type TcdbTradePartnerTag = {
  id: number;
  slug: string;
  displayName: string;
  href?: string;
  hrefKind: string;
  tagType: string;
};
export type TcdbTradePartnerContentTag = Omit<
  TcdbTradePartnerTag,
  "tagType"
> & {
  sourceType: "homie" | "clan" | "tag";
  sourceId?: number;
  tagType?: string;
};
export type TcdbTradePartnerSetImpact = {
  setId: number;
  setSlug: string;
  setName: string;
  snapshotDate: string;
  cardsOwned: number;
  totalCards: number;
  tradeId: string;
  completed: boolean;
};

type Row = Record<string, number | string | boolean | null>;
const integer = (value: number | string | boolean | null) =>
  Number.parseInt(String(value ?? 0), 10);
const optional = (value: number | string | boolean | null) => {
  const result = typeof value === "string" ? value.trim() : "";
  return result || undefined;
};

function mapSummary(row: Row): TcdbTradePartnerSummary {
  return {
    id: integer(row.trade_partner_id),
    tcdbUsername: String(row.tcdb_username),
    tradeCount: integer(row.trade_count),
    cardsSent: integer(row.cards_sent),
    cardsReceived: integer(row.cards_received),
    totalCardsExchanged: integer(row.total_cards_exchanged),
    hallOfFameCount: integer(row.hall_of_fame_count),
    ...(optional(row.name) ? { name: optional(row.name) } : {}),
    ...(optional(row.city_state)
      ? { cityState: optional(row.city_state) }
      : {}),
    ...(optional(row.country) ? { country: optional(row.country) } : {}),
    ...(optional(row.first_trade_date)
      ? { firstTradeDate: optional(row.first_trade_date) }
      : {}),
    ...(optional(row.latest_trade_date)
      ? { latestTradeDate: optional(row.latest_trade_date) }
      : {}),
  };
}

const summarySelect = sql;

export async function listTcdbTradePartnersFromDb(): Promise<
  TcdbTradePartnerSummary[]
> {
  const rows =
    await summarySelect<Row>`SELECT trade_partner_id, tcdb_username, name, city_state, country,
    trade_count, cards_sent, cards_received, total_cards_exchanged,
    TO_CHAR(first_trade_date, 'YYYY-MM-DD') AS first_trade_date,
    TO_CHAR(latest_trade_date, 'YYYY-MM-DD') AS latest_trade_date, hall_of_fame_count
    FROM dojo.v_tcdb_trade_partner_summary
    ORDER BY latest_trade_date DESC NULLS LAST, LOWER(tcdb_username)`;
  return rows.map(mapSummary);
}

export async function getTcdbTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerSummary | null> {
  const [row] =
    await sql<Row>`SELECT trade_partner_id, tcdb_username, name, city_state, country,
    trade_count, cards_sent, cards_received, total_cards_exchanged,
    TO_CHAR(first_trade_date, 'YYYY-MM-DD') AS first_trade_date,
    TO_CHAR(latest_trade_date, 'YYYY-MM-DD') AS latest_trade_date, hall_of_fame_count
    FROM dojo.v_tcdb_trade_partner_summary WHERE trade_partner_id = ${id} LIMIT 1`;
  return row ? mapSummary(row) : null;
}

export async function listTcdbTradesForPartnerFromDb(
  id: number,
): Promise<TcdbTradeSummary[]> {
  const rows =
    await sql<Row>`SELECT trade.trade_id, partner.id AS trade_partner_id,
    partner.tcdb_username, partner.name AS partner_name, partner.city_state, partner.country,
    TO_CHAR(MIN(day.trade_date), 'YYYY-MM-DD') AS start_date,
    TO_CHAR(MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')), 'YYYY-MM-DD') AS end_date,
    COUNT(day.id) AS section_count,
    COALESCE(BOOL_OR(day.side IN ('received', 'archived')), FALSE) AS has_completed,
    trade.received, trade.sent
    FROM dojo.tcdb_trade AS trade
    JOIN dojo.tcdb_trade_partner AS partner ON partner.id = trade.trade_partner_id
    LEFT JOIN dojo.tcdb_trade_day AS day ON day.trade_id = trade.trade_id
    WHERE partner.id = ${id}
    GROUP BY trade.id, partner.id ORDER BY trade.trade_id DESC`;
  return rows.map((row) => {
    const received = row.received === null ? undefined : integer(row.received);
    const sent = row.sent === null ? undefined : integer(row.sent);
    return {
      tradeId: String(row.trade_id),
      tradePartnerId: integer(row.trade_partner_id),
      partner: String(row.tcdb_username),
      startDate: String(row.start_date ?? ""),
      sectionCount: integer(row.section_count),
      status: row.has_completed ? "Completed" : "Open",
      ...(optional(row.partner_name)
        ? { partnerName: optional(row.partner_name) }
        : {}),
      ...(optional(row.city_state)
        ? { cityState: optional(row.city_state) }
        : {}),
      ...(optional(row.country) ? { country: optional(row.country) } : {}),
      ...(optional(row.end_date) ? { endDate: optional(row.end_date) } : {}),
      ...(received !== undefined ? { received } : {}),
      ...(sent !== undefined ? { sent } : {}),
      ...(received !== undefined || sent !== undefined
        ? { total: (received ?? 0) + (sent ?? 0) }
        : {}),
    };
  });
}

export async function listHomiesForTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerHomie[]> {
  const rows =
    await sql<Row>`SELECT homie.id, homie.name, homie.tag_slug FROM dojo.tcdb_trade_partner_homie link
    JOIN dojo.homie AS homie ON homie.id = link.homie_id WHERE link.trade_partner_id = ${id} ORDER BY homie.name`;
  return rows.map((row) => ({
    id: integer(row.id),
    name: String(row.name),
    ...(optional(row.tag_slug) ? { tagSlug: optional(row.tag_slug) } : {}),
  }));
}

export async function listClansForTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerClan[]> {
  const rows =
    await sql<Row>`SELECT clan.id, clan.name, clan.slug, clan.tag_slug FROM dojo.tcdb_trade_partner_clan link
    JOIN dojo.clan AS clan ON clan.id = link.clan_id WHERE link.trade_partner_id = ${id} ORDER BY clan.name`;
  return rows.map((row) => ({
    id: integer(row.id),
    name: String(row.name),
    slug: String(row.slug),
    ...(optional(row.tag_slug) ? { tagSlug: optional(row.tag_slug) } : {}),
  }));
}

export async function listTagsForTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerTag[]> {
  const rows =
    await sql<Row>`SELECT tag.id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug) AS display_name,
    tag.href, tag.href_kind, link.tag_type FROM dojo.tcdb_trade_partner_tag link
    JOIN dojo.tags AS tag ON tag.id = link.tag_id WHERE link.trade_partner_id = ${id} ORDER BY link.tag_type, tag.slug`;
  return rows.map((row) => ({
    id: integer(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    hrefKind: String(row.href_kind),
    tagType: String(row.tag_type),
    ...(optional(row.href) ? { href: optional(row.href) } : {}),
  }));
}

export async function listContentTagsForTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerContentTag[]> {
  const rows =
    await sql<Row>`SELECT tag_id, slug, display_name, href, href_kind, source_type, source_id, tag_type
    FROM dojo.v_tcdb_trade_partner_content_tags WHERE trade_partner_id = ${id} ORDER BY source_type, slug`;
  return rows.map((row) => ({
    id: integer(row.tag_id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    hrefKind: String(row.href_kind),
    sourceType: String(
      row.source_type,
    ) as TcdbTradePartnerContentTag["sourceType"],
    ...(row.source_id !== null ? { sourceId: integer(row.source_id) } : {}),
    ...(optional(row.tag_type) ? { tagType: optional(row.tag_type) } : {}),
    ...(optional(row.href) ? { href: optional(row.href) } : {}),
  }));
}

export async function listTradePartnersForHomieFromDb(
  homieId: number,
): Promise<TcdbTradePartnerSummary[]> {
  if (process.env.NODE_ENV === "test") return [];
  const rows =
    await sql<Row>`SELECT summary.* FROM dojo.tcdb_trade_partner_homie link
    JOIN dojo.v_tcdb_trade_partner_summary summary ON summary.trade_partner_id = link.trade_partner_id
    WHERE link.homie_id = ${homieId} ORDER BY summary.latest_trade_date DESC NULLS LAST`;
  return rows.map(mapSummary);
}

export async function listTradePartnersForClanFromDb(
  clanId: number,
): Promise<TcdbTradePartnerSummary[]> {
  if (process.env.NODE_ENV === "test") return [];
  const rows =
    await sql<Row>`SELECT summary.* FROM dojo.tcdb_trade_partner_clan link
    JOIN dojo.v_tcdb_trade_partner_summary summary ON summary.trade_partner_id = link.trade_partner_id
    WHERE link.clan_id = ${clanId} ORDER BY summary.latest_trade_date DESC NULLS LAST`;
  return rows.map(mapSummary);
}

export async function listSetCollectorImpactForTradePartnerFromDb(
  id: number,
): Promise<TcdbTradePartnerSetImpact[]> {
  const rows =
    await sql<Row>`SELECT DISTINCT ON (collector.set_collector_header_id)
    collector.set_collector_header_id, collector.set_slug, collector.set_name,
    TO_CHAR(collector.snapshot_date, 'YYYY-MM-DD') AS snapshot_date,
    collector.cards_owned, collector.total_cards, collector.tcdb_trade_id
    FROM dojo.v_set_collector_header_snapshot collector
    JOIN dojo.tcdb_trade trade ON trade.trade_id = collector.tcdb_trade_id
    WHERE trade.trade_partner_id = ${id}
    ORDER BY collector.set_collector_header_id, collector.snapshot_date DESC, collector.set_collector_snapshot_id DESC`;
  return rows.map((row) => ({
    setId: integer(row.set_collector_header_id),
    setSlug: String(row.set_slug),
    setName: String(row.set_name),
    snapshotDate: String(row.snapshot_date),
    cardsOwned: integer(row.cards_owned),
    totalCards: integer(row.total_cards),
    tradeId: String(row.tcdb_trade_id),
    completed: integer(row.cards_owned) === integer(row.total_cards),
  }));
}
