import 'server-only';
import { neon } from '@neondatabase/serverless';

export type Trend = 'up' | 'down' | 'flat';

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

const sql = neon(process.env.DATABASE_URL!);

// KISS query builder: safe params via sql.query(query, params)
export async function listTcdbRankings(opts: {
  page: number;
  pageSize: number;
  q?: string;
  trend?: Trend;
}): Promise<RankingResponse> {
  const page = Math.max(1, Number(opts.page ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(opts.pageSize ?? 50)));
  const q = (opts.q ?? '').trim();
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
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const rows = (await sql.query(
    `
    SELECT homie_id, name, card_count, ranking, ranking_at, difference,
           rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed
    FROM tcdb_rankings
    ${whereSql}
    ORDER BY ranking ASC
    LIMIT $${i++} OFFSET $${i++}
    `,
    [...params, pageSize, offset]
  )) as RankingRow[];

  const [{ c: totalStr } = { c: '0' }] = (await sql.query(
    `SELECT COUNT(*)::text AS c FROM tcdb_rankings ${whereSql}`,
    params
  )) as { c: string }[];
  const total = Number(totalStr) || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    data: rows,
    meta: { page, pageSize, total, totalPages, q: q || undefined, trend },
  };
}
