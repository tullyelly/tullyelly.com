// app/api/tcdb-rankings/route.ts
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

type Trend = 'up' | 'down' | 'flat';

type RawRankingRow = {
  homie_id: unknown;
  name: unknown;
  card_count: unknown;
  ranking: unknown;
  ranking_at: unknown;
  difference: unknown;
  rank_delta: unknown;
  diff_delta: unknown;
  trend_rank: unknown;
  trend_overall: unknown;
  diff_sign_changed: unknown;
};

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

type NeonField = {
  name: string;
};

type NeonQueryResponse = {
  fields: NeonField[];
  rows: (string | null)[][];
};

type NeonConfig = {
  connectionString: string;
  endpoint: string;
};

const NEON_ARRAY_MODE_HEADER = 'true';
const NEON_RAW_TEXT_HEADER = 'true';

let cachedConfig: NeonConfig | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getNeonConfig(): NeonConfig {
  if (cachedConfig) return cachedConfig;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  let endpointHost: string;
  try {
    const parsed = new URL(connectionString);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      throw new Error(`Unsupported database protocol: ${parsed.protocol || '<unknown>'}`);
    }
    const hostname = parsed.hostname;
    if (!hostname) {
      throw new Error('DATABASE_URL is missing hostname');
    }
    endpointHost = hostname.includes('.') ? hostname.replace(/^[^.]+\./, 'api.') : hostname;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing DATABASE_URL';
    throw new Error(`Invalid DATABASE_URL: ${message}`);
  }

  cachedConfig = {
    connectionString,
    endpoint: `https://${endpointHost}/sql`,
  };

  return cachedConfig;
}

async function runQuery<T extends Record<string, unknown>>(query: string, params: unknown[]) {
  const { endpoint, connectionString } = getNeonConfig();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Neon-Connection-String': connectionString,
      'Neon-Array-Mode': NEON_ARRAY_MODE_HEADER,
      'Neon-Raw-Text-Output': NEON_RAW_TEXT_HEADER,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Neon query failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as NeonQueryResponse;
  if (!payload || !Array.isArray(payload.fields) || !Array.isArray(payload.rows)) {
    throw new Error('Unexpected Neon response shape');
  }

  return payload.rows.map((row) => {
    const record: Record<string, unknown> = {};
    payload.fields.forEach((field, index) => {
      record[field.name] = row[index] ?? null;
    });
    return record as T;
  });
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      throw new Error('Encountered NaN for numeric field');
    }
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
    return parsed;
  }
  throw new Error(`Unexpected numeric value: ${String(value)}`);
}

function parseNullableNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  return null;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 't' || normalized === 'true' || normalized === '1') return true;
    if (normalized === 'f' || normalized === 'false' || normalized === '0') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

function parseTrend(value: unknown): Trend {
  if (value === 'up' || value === 'down' || value === 'flat') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'up' || normalized === 'down' || normalized === 'flat') {
      return normalized as Trend;
    }
  }
  throw new Error(`Unexpected trend value: ${String(value)}`);
}

function parseString(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function mapRankingRow(row: RawRankingRow): RankingRow {
  return {
    homie_id: parseNumber(row.homie_id),
    name: parseString(row.name),
    card_count: parseNumber(row.card_count),
    ranking: parseNumber(row.ranking),
    ranking_at: parseString(row.ranking_at),
    difference: parseNumber(row.difference),
    rank_delta: parseNullableNumber(row.rank_delta),
    diff_delta: parseNullableNumber(row.diff_delta),
    trend_rank: parseTrend(row.trend_rank),
    trend_overall: parseTrend(row.trend_overall),
    diff_sign_changed: parseBoolean(row.diff_sign_changed),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const pageSizeParam = Number.parseInt(searchParams.get('pageSize') ?? '', 10);
    const pageSize = clamp(Number.isFinite(pageSizeParam) ? pageSizeParam : 20, 1, 500);

    const qRaw = searchParams.get('q');
    const q = qRaw ? qRaw.trim() : '';

    const trendRaw = searchParams.get('trend');
    const trendNormalized = trendRaw ? trendRaw.trim().toLowerCase() : '';
    const trendFilter: Trend | undefined =
      trendNormalized === 'up' || trendNormalized === 'down' || trendNormalized === 'flat'
        ? (trendNormalized as Trend)
        : undefined;

    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (q) {
      values.push(`%${q}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (trendFilter) {
      values.push(trendFilter);
      conditions.push(`trend_overall = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows = await runQuery<{ count: unknown }>(
      `SELECT COUNT(*)::int AS count FROM homie_tcdb_ranking_rt ${whereClause}`,
      values,
    );
    const total = countRows[0] ? parseNumber(countRows[0].count) : 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;
    const dataParams = [...values, pageSize, offset];

    const rows = await runQuery<RawRankingRow>(
      `SELECT
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
      ${whereClause}
      ORDER BY card_count DESC, ranking ASC, ranking_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      dataParams,
    );

    const data = rows.map(mapRankingRow);

    const meta: { page: number; pageSize: number; total: number; totalPages: number; q?: string; trend?: Trend } = {
      page,
      pageSize,
      total,
      totalPages,
    };
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
