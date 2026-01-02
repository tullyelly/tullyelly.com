import "server-only";
import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryOne, sqlQueryRows } from "@/lib/db-sql-helpers";

export type Trend = "up" | "down" | "flat";

export type RankingRow = {
  homie_id: number;
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
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    q?: string;
    trend?: Trend;
  };
};

const TCDB_TABLE = "homie_tcdb_ranking_rt" as const;

if (process.env.NODE_ENV !== "production") {
  void (async () => {
    try {
      const reg = await withDbRetry(() =>
        sqlQueryOne<{ r: string | null }>(
          "SELECT to_regclass('public.' || $1::text) AS r",
          [TCDB_TABLE],
        ),
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
  const params: any[] = [];
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

  const data: RankingRow[] = rows.map((row) => {
    const ranking_at = asDateString(row.ranking_at);
    if (!ranking_at) {
      throw new Error("Invalid ranking_at value from database");
    }
    return { ...row, ranking_at };
  });

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

export async function getTcdbRanking(
  id: string | number,
): Promise<RankingRow | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  const row = await withDbRetry(() =>
    sqlQueryOne<DbRankingRow>(
      `
        SELECT homie_id,
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
        WHERE homie_id = $1
        LIMIT 1
      `,
      [numericId],
    ),
  );
  if (!row) return null;
  const ranking_at = asDateString(row.ranking_at);
  if (!ranking_at) {
    throw new Error("Invalid ranking_at value from database");
  }
  return { ...row, ranking_at };
}
