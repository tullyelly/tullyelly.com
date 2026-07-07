import "server-only";
import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryOne, sqlQueryRows } from "@/lib/db-sql-helpers";

export type Trend = "up" | "down" | "flat";

export const TCDB_RANKING_TRENDS = ["up", "down", "flat"] as const;

export function isTrend(value: string | null | undefined): value is Trend {
  return TCDB_RANKING_TRENDS.includes(value as Trend);
}

export type RankingMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q?: string;
  trend?: Trend;
};

export type RankingRow = {
  homie_id: number;
  tag_slug: string | null;
  route_slug: string;
  name: string;
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

export type RankingResponse = {
  data: RankingRow[];
  meta: RankingMeta;
};

export type HomieTcdbSnapshotRow = {
  homie_id: number;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
};

const TCDB_TABLE = "dojo.v_homie_tcdb_ranking_route" as const;

if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  void (async () => {
    try {
      const reg = await withDbRetry(() =>
        sqlQueryOne<{ r: string | null }>("SELECT to_regclass($1::text) AS r", [
          TCDB_TABLE,
        ]),
      );

      if (!reg?.r) {
        console.warn(
          `[tcdb] Missing relation for ${TCDB_TABLE}; update tcdb rankings queries or schema.`,
        );
      }
    } catch (error) {
      console.warn(`[tcdb] Sanity check failed for ${TCDB_TABLE}`, error);
    }
  })();
}

export type DbRankingRow = {
  homie_id: number;
  tag_slug: string | null;
  route_slug: string;
  name: string;
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

function normalizeRankingRow(row: DbRankingRow): RankingRow {
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from database");
  }
  return { ...row, ranking_at };
}

function normalizeSnapshotRow(
  row: HomieTcdbSnapshotRow,
): HomieTcdbSnapshotRow {
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from TCDB snapshot history");
  }

  return { ...row, ranking_at };
}

export async function listTcdbRankings(opts: {
  page: number;
  pageSize: number;
  q?: string;
  trend?: Trend;
}): Promise<RankingResponse> {
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
    sqlQueryRows<DbRankingRow>(
      `
        SELECT homie_id,
               tag_slug,
               route_slug,
               name,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_TABLE}
        ${whereSql}
        ORDER BY card_count DESC, ranking ASC, ranking_at DESC
        LIMIT $${i++} OFFSET $${i++}
      `,
      [...params, pageSize, offset],
    ),
  );

  const data = rows.map(normalizeRankingRow);

  const [{ c: totalStr } = { c: "0" }] = await withDbRetry(() =>
    sqlQueryRows<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM ${TCDB_TABLE} ${whereSql}`,
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

export async function getHomieTcdbRankingByRouteKey(
  tagSlugOrId: string | number,
): Promise<RankingRow | null> {
  const routeKey = String(tagSlugOrId).trim();
  if (!routeKey) return null;

  const isNumericId = /^\d+$/.test(routeKey);
  const whereSql = isNumericId
    ? "homie_id = $1::bigint"
    : "tag_slug = $1";
  const param = isNumericId ? routeKey : routeKey.toLowerCase();

  const row = await withDbRetry(() =>
    sqlQueryOne<DbRankingRow>(
      `
        SELECT homie_id,
               tag_slug,
               route_slug,
               name,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_TABLE}
        WHERE ${whereSql}
        LIMIT 1
      `,
      [param],
    ),
  );
  if (!row) return null;
  return normalizeRankingRow(row);
}

export async function listHomieTcdbSnapshotHistory(
  homieId: number | string,
): Promise<HomieTcdbSnapshotRow[]> {
  const normalizedHomieId = String(homieId).trim();
  if (!/^\d+$/.test(normalizedHomieId)) return [];

  const rows = await withDbRetry(() =>
    sqlQueryRows<HomieTcdbSnapshotRow>(
      `
        SELECT homie_id,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference
        FROM dojo.homie_tcdb_snapshot_rt
        WHERE homie_id = $1::bigint
        ORDER BY ranking_at ASC
      `,
      [normalizedHomieId],
    ),
  );

  return rows.map(normalizeSnapshotRow);
}

export async function listNumberOneTcdbHomieRankings(): Promise<RankingRow[]> {
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbRankingRow>(
      `
        SELECT homie_id,
               tag_slug,
               route_slug,
               name,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_TABLE}
        WHERE ranking = 1
        ORDER BY card_count DESC, name ASC
      `,
    ),
  );

  return rows.map(normalizeRankingRow);
}

export async function listTopTcdbHomieRankings(
  limit = 5,
): Promise<RankingRow[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbRankingRow>(
      `
        SELECT homie_id,
               tag_slug,
               route_slug,
               name,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_TABLE}
        ORDER BY card_count DESC, ranking ASC, ranking_at DESC
        LIMIT $1
      `,
      [safeLimit],
    ),
  );

  return rows.map(normalizeRankingRow);
}

async function listRecentTcdbHomieMovers(
  trend: Extract<Trend, "up" | "down">,
  limit = 5,
): Promise<RankingRow[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const direction = trend === "up" ? "DESC" : "ASC";
  const rows = await withDbRetry(() =>
    sqlQueryRows<DbRankingRow>(
      `
        SELECT homie_id,
               tag_slug,
               route_slug,
               name,
               card_count,
               ranking,
               ranking_at::text AS ranking_at,
               difference,
               rank_delta,
               diff_delta,
               trend_rank,
               trend_overall,
               diff_sign_changed
        FROM ${TCDB_TABLE}
        WHERE trend_overall = $1
        ORDER BY ranking_at DESC,
                 rank_delta ${direction} NULLS LAST,
                 diff_delta ${direction} NULLS LAST,
                 card_count DESC,
                 name ASC
        LIMIT $2
      `,
      [trend, safeLimit],
    ),
  );

  return rows.map(normalizeRankingRow);
}

export async function listRecentTcdbHomieRisers(
  limit = 5,
): Promise<RankingRow[]> {
  return listRecentTcdbHomieMovers("up", limit);
}

export async function listRecentTcdbHomieFallers(
  limit = 5,
): Promise<RankingRow[]> {
  return listRecentTcdbHomieMovers("down", limit);
}
