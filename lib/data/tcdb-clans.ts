import "server-only";

import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryRows } from "@/lib/db-sql-helpers";
import type { RankingMeta, Trend } from "@/lib/data/tcdb";

export type ClanRankingRow = {
  clan_id: number;
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

const TCDB_CLAN_TABLE = "dojo.clan_tcdb_ranking_rt" as const;
const CLAN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type DbClanRankingRow = ClanRankingRow;

function normalizeClanRankingRow(row: DbClanRankingRow): ClanRankingRow {
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from database");
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
    where.push(`name ILIKE $${i++}`);
    params.push(`%${q}%`);
  }
  if (trend) {
    where.push(`trend_overall = $${i++}`);
    params.push(trend);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT clan_id,
               name,
               slug,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_CLAN_TABLE}
        ${whereSql}
        ORDER BY card_count DESC, ranking ASC, ranking_at DESC
        LIMIT $${i++} OFFSET $${i++}
      `,
      [...params, pageSize, offset],
    ),
  );

  const data = rows.map(normalizeClanRankingRow);

  const [{ c: totalStr } = { c: "0" }] = await withDbRetry(() =>
    sqlQueryRows<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM ${TCDB_CLAN_TABLE} ${whereSql}`,
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
        SELECT clan_id,
               name,
               slug,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_CLAN_TABLE}
        WHERE slug = $1
        ORDER BY sport ASC
      `,
      [normalizedSlug],
    ),
  );

  return rows.map(normalizeClanRankingRow);
}

export async function listNumberOneTcdbClanRankings(): Promise<
  ClanRankingRow[]
> {
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanRankingRow>(
      `
        SELECT clan_id,
               name,
               slug,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_CLAN_TABLE}
        WHERE ranking = 1
        ORDER BY card_count DESC, name ASC, sport ASC
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
        SELECT clan_id,
               name,
               slug,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_CLAN_TABLE}
        ORDER BY card_count DESC, ranking ASC, ranking_at DESC, sport ASC
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
        SELECT clan_id,
               name,
               slug,
               sport,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_CLAN_TABLE}
        WHERE trend_overall = $1
        ORDER BY ranking_at DESC,
                 rank_delta ${direction} NULLS LAST,
                 diff_delta ${direction} NULLS LAST,
                 card_count DESC,
                 name ASC,
                 sport ASC
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
