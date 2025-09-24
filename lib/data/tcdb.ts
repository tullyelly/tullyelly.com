import "server-only";
import { neon } from "@neondatabase/serverless";

import { asDateString } from "@/lib/dates";

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
const sql = neon(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  void (async () => {
    try {
      const [{ r } = { r: null }] = (await sql.query(
        "SELECT to_regclass('public.' || $1::text) AS r",
        [TCDB_TABLE],
      )) as { r: string | null }[];

      if (!r) {
        console.warn(
          `[tcdb] Missing relation for ${TCDB_TABLE}; update tcdb rankings queries or schema.`,
        );
      }
    } catch (error) {
      console.warn(`[tcdb] Sanity check failed for ${TCDB_TABLE}`, error);
    }
  })();
}

// KISS query builder: safe params via sql.query(query, params)
type DbRankingRow = Omit<RankingRow, "ranking_at"> & { ranking_at: unknown };

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

  const rows = (await sql.query(
    `
    SELECT homie_id, name, card_count, ranking, ranking_at::text AS ranking_at, difference,
           rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed
    FROM ${TCDB_TABLE}
    ${whereSql}
    ORDER BY card_count DESC, ranking ASC, ranking_at DESC
    LIMIT $${i++} OFFSET $${i++}
    `,
    [...params, pageSize, offset],
  )) as DbRankingRow[];

  const data: RankingRow[] = rows.map((row) => {
    const ranking_at = asDateString(row.ranking_at);
    if (!ranking_at) {
      throw new Error("Invalid ranking_at value from database");
    }
    return { ...row, ranking_at };
  });

  const [{ c: totalStr } = { c: "0" }] = (await sql.query(
    `SELECT COUNT(*)::text AS c FROM ${TCDB_TABLE} ${whereSql}`,
    params,
  )) as { c: string }[];
  const total = Number(totalStr) || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    data,
    meta: { page, pageSize, total, totalPages, q: q || undefined, trend },
  };
}
