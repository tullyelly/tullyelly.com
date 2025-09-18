// app/api/tcdb-rankings/route.ts
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { neon /*, neonConfig*/ } from '@neondatabase/serverless';

// If you also run this route in Node runtimes at times, you can enable fetch connection caching:
// neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);

type Trend = 'up' | 'down' | 'flat';

type RankingRow = {
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: unknown, field: string): number {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) throw new Error(`Encountered NaN for numeric field ${field}`);
    return value;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  throw new Error(`Invalid numeric value for ${field}: ${String(value)}`);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 't' || v === 'true' || v === '1') return true;
    if (v === 'f' || v === 'false' || v === '0') return false;
  }
  return Boolean(value);
}

function toTrend(value: unknown, field: string): Trend {
  if (value === 'up' || value === 'down' || value === 'flat') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'up' || v === 'down' || v === 'flat') return v as Trend;
  }
  throw new Error(`Unexpected trend value for ${field}: ${String(value)}`);
}

function toStringValue(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRow(row: any): RankingRow {
  return {
    homie_id: toNumber(row.homie_id, 'homie_id'),
    name: toStringValue(row.name),
    card_count: toNumber(row.card_count, 'card_count'),
    ranking: toNumber(row.ranking, 'ranking'),
    ranking_at: toStringValue(row.ranking_at),
    difference: toNumber(row.difference, 'difference'),
    rank_delta: toNullableNumber(row.rank_delta),
    diff_delta: toNullableNumber(row.diff_delta),
    trend_rank: toTrend(row.trend_rank, 'trend_rank'),
    trend_overall: toTrend(row.trend_overall, 'trend_overall'),
    diff_sign_changed: toBoolean(row.diff_sign_changed),
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured');
    }

    const { searchParams } = new URL(req.url);

    // Pagination
    const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const pageSizeParam = Number.parseInt(searchParams.get('pageSize') ?? '', 10);
    const pageSize = clamp(Number.isFinite(pageSizeParam) ? pageSizeParam : 20, 1, 500);

    const offset = (page - 1) * pageSize;

    // Filters
    const qRaw = searchParams.get('q');
    const q = qRaw ? qRaw.trim() : '';

    const trendRaw = searchParams.get('trend');
    const trendNormalized = trendRaw ? trendRaw.trim().toLowerCase() : '';
    const trendFilter: Trend | undefined =
      trendNormalized === 'up' || trendNormalized === 'down' || trendNormalized === 'flat'
        ? (trendNormalized as Trend)
        : undefined;

    // Use NULLable parameters to avoid ad-hoc SQL building.
    const qFilter: string | null = q ? `%${q}%` : null;
    const trendParam: Trend | null = trendFilter ?? null;

    // Count (⚠️ cast result instead of generics)
    const countRows = (await sql`
      SELECT COUNT(*)::int AS count
      FROM homie_tcdb_ranking_rt
      WHERE (${qFilter} IS NULL OR name ILIKE ${qFilter})
        AND (${trendParam} IS NULL OR trend_overall = ${trendParam})
    `) as Array<{ count: number }>;

    const total = countRows[0]?.count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    // Data (⚠️ cast result instead of generics)
    const rows = (await sql`
      SELECT
        homie_id,
        name,
        card_count,
        ranking,
        ranking_at,
        difference,
        rank_delta,
        diff_delta,
        trend_rank,
        trend_overall,
        diff_sign_changed
      FROM homie_tcdb_ranking_rt
      WHERE (${qFilter} IS NULL OR name ILIKE ${qFilter})
        AND (${trendParam} IS NULL OR trend_overall = ${trendParam})
      ORDER BY card_count DESC, ranking ASC, ranking_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as any[];

    const data = rows.map(mapRow);

    const meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      q?: string;
      trend?: Trend;
    } = { page, pageSize, total, totalPages };
    if (q) meta.q = q;
    if (trendFilter) meta.trend = trendFilter;

    const response = NextResponse.json({ data, meta });
    response.headers.set('X-Env', process.env.VERCEL_ENV || 'local');
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      response.headers.set('X-Commit', process.env.VERCEL_GIT_COMMIT_SHA);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}