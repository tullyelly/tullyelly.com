import "server-only";

import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryRows } from "@/lib/db-sql-helpers";
import type { RankingMeta, Trend } from "@/lib/data/tcdb";

export type ClanRankingRow = {
  clan_id: number;
  tag_slug: string | null;
  name: string;
  slug: string;
  sport: string;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
  rank_delta: number | null;
  diff_delta: number | null;
  trend_rank: Trend;
  trend_overall: Trend;
  diff_sign_changed: boolean;
};

export type ClanRankingResponse = {
  data: ClanRankingRow[];
  meta: RankingMeta;
};

export type ClanTcdbSnapshotRow = {
  clan_id: number;
  sport: string;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
};

const TCDB_CLAN_TABLE = "dojo.clan_tcdb_ranking_rt" as const;
const CLAN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type DbClanRankingRow = ClanRankingRow;
type DbClanTcdbSnapshotRow = ClanTcdbSnapshotRow;

function normalizeClanRankingRow(row: DbClanRankingRow): ClanRankingRow {
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from database");
  }
  return { ...row, ranking_at };
}

function normalizeClanSnapshotRow(
  row: DbClanTcdbSnapshotRow,
): ClanTcdbSnapshotRow {
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from clan snapshot history");
  }

  return { ...row, ranking_at };
}

function normalizeSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return CLAN_SLUG_PATTERN.test(normalized) ? normalized : null;
}

export async function listTcdbClanRankings(opts: {
  page: number;
  pageSize: number;
  q?: string;
  trend?: Trend;
}): Promise<ClanRankingResponse> {
  const page = Math.max(1, Number(opts.page ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(opts.pageSize ?? 50)));
  const q = (opts.q ?? "").trim();
  const trend = opts.trend;

  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (q) {
    where.push(`r.name ILIKE $${i++}`);
    params.push(`%${q}%`);
  }
  if (trend) {
    where.push(`r.trend_overall = $${i++}`);
    params.push(trend);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT r.clan_id,
               NULLIF(btrim(c.tag_slug), '') AS tag_slug,
               r.name,
               r.slug,
               r.sport,
               r.card_count,
               r.ranking,
               r.ranking_at::text AS ranking_at,
               r.difference,
               r.rank_delta,
               r.diff_delta,
               r.trend_rank,
               r.trend_overall,
               r.diff_sign_changed
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        ${whereSql}
        ORDER BY r.card_count DESC, r.ranking ASC, r.ranking_at DESC
        LIMIT $${i++} OFFSET $${i++}
      `,
      [...params, pageSize, offset],
    ),
  );

  const data = rows.map(normalizeClanRankingRow);

  const [{ c: totalStr } = { c: "0" }] = await withDbRetry(() =>
    sqlQueryRows<{ c: string }>(
      `
        SELECT COUNT(*)::text AS c
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        ${whereSql}
      `,
      params,
    ),
  );
  const total = Number(totalStr) || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    data,
    meta: { page, pageSize, total, totalPages, q: q || undefined, trend },
  };
}

export async function getTcdbClanRankingsBySlug(
  slug: string,
): Promise<ClanRankingRow[]> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return [];

  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT r.clan_id,
               NULLIF(btrim(c.tag_slug), '') AS tag_slug,
               r.name,
               r.slug,
               r.sport,
               r.card_count,
               r.ranking,
               r.ranking_at::text AS ranking_at,
               r.difference,
               r.rank_delta,
               r.diff_delta,
               r.trend_rank,
               r.trend_overall,
               r.diff_sign_changed
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        WHERE r.slug = $1
        ORDER BY r.sport ASC
      `,
      [normalizedSlug],
    ),
  );

  return rows.map(normalizeClanRankingRow);
}

export async function listClanTcdbSnapshotHistory(
  clanId: number | string,
): Promise<ClanTcdbSnapshotRow[]> {
  const normalizedClanId = String(clanId).trim();
  if (!/^\d+$/.test(normalizedClanId)) return [];

  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanTcdbSnapshotRow>(
      `
        SELECT clan_id,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference
        FROM dojo.clan_tcdb_snapshot_rt
        WHERE clan_id = $1::bigint
        ORDER BY sport ASC, ranking_at ASC
      `,
      [normalizedClanId],
    ),
  );

  return rows.map(normalizeClanSnapshotRow);
}

export async function listNumberOneTcdbClanRankings(): Promise<
  ClanRankingRow[]
> {
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT r.clan_id,
               NULLIF(btrim(c.tag_slug), '') AS tag_slug,
               r.name,
               r.slug,
               r.sport,
               r.card_count,
               r.ranking,
               r.ranking_at::text AS ranking_at,
               r.difference,
               r.rank_delta,
               r.diff_delta,
               r.trend_rank,
               r.trend_overall,
               r.diff_sign_changed
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        WHERE r.ranking = 1
        ORDER BY r.card_count DESC, r.name ASC, r.sport ASC
      `,
    ),
  );

  return rows.map(normalizeClanRankingRow);
}

export async function listTopTcdbClanRankings(
  limit = 5,
): Promise<ClanRankingRow[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT r.clan_id,
               NULLIF(btrim(c.tag_slug), '') AS tag_slug,
               r.name,
               r.slug,
               r.sport,
               r.card_count,
               r.ranking,
               r.ranking_at::text AS ranking_at,
               r.difference,
               r.rank_delta,
               r.diff_delta,
               r.trend_rank,
               r.trend_overall,
               r.diff_sign_changed
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        ORDER BY r.card_count DESC, r.ranking ASC, r.ranking_at DESC, r.sport ASC
        LIMIT $1
      `,
      [safeLimit],
    ),
  );

  return rows.map(normalizeClanRankingRow);
}

async function listRecentTcdbClanMovers(
  trend: Extract<Trend, "up" | "down">,
  limit = 5,
): Promise<ClanRankingRow[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const direction = trend === "up" ? "DESC" : "ASC";
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT r.clan_id,
               NULLIF(btrim(c.tag_slug), '') AS tag_slug,
               r.name,
               r.slug,
               r.sport,
               r.card_count,
               r.ranking,
               r.ranking_at::text AS ranking_at,
               r.difference,
               r.rank_delta,
               r.diff_delta,
               r.trend_rank,
               r.trend_overall,
               r.diff_sign_changed
        FROM ${TCDB_CLAN_TABLE} AS r
        JOIN dojo.clan AS c
          ON c.id = r.clan_id
        WHERE r.trend_overall = $1
        ORDER BY r.ranking_at DESC,
                 r.rank_delta ${direction} NULLS LAST,
                 r.diff_delta ${direction} NULLS LAST,
                 r.card_count DESC,
                 r.name ASC,
                 r.sport ASC
        LIMIT $2
      `,
      [trend, safeLimit],
    ),
  );

  return rows.map(normalizeClanRankingRow);
}

export async function listRecentTcdbClanRisers(
  limit = 5,
): Promise<ClanRankingRow[]> {
  return listRecentTcdbClanMovers("up", limit);
}

export async function listRecentTcdbClanFallers(
  limit = 5,
): Promise<ClanRankingRow[]> {
  return listRecentTcdbClanMovers("down", limit);
}
