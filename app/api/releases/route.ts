import { NextResponse } from 'next/server';
import { logger } from '@/app/lib/server-logger';
import { getPool } from '@/db/pool';
import type { PageMeta, ReleaseListResponse } from '@/types/releases';
import type { QueryResult } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY = {
  'semver:desc': `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int DESC,
    created_at DESC, id DESC`,
  'semver:asc': `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int ASC,
    created_at DESC, id DESC`,
  'created_at:desc': 'ORDER BY created_at DESC, id DESC',
  'created_at:asc': 'ORDER BY created_at ASC, id ASC',
} as const;

type Sort = keyof typeof ORDER_BY;

type ReleaseItem = {
  id: string | number;
  name: string;
  status: string;
  type: string;
  semver: string;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix: number;
};

class InputError extends Error {}

function parseQuery(url: string) {
  const { searchParams } = new URL(url);

  const limitRaw = searchParams.get('limit');
  let limit = 20;
  if (limitRaw !== null) {
    const num = Number.parseInt(limitRaw, 10);
    if (Number.isNaN(num)) throw new InputError('invalid limit');
    limit = num;
  }
  limit = Math.min(Math.max(limit, 1), 100);

  const offsetRaw = searchParams.get('offset');
  let offset = 0;
  if (offsetRaw !== null) {
    const num = Number.parseInt(offsetRaw, 10);
    if (Number.isNaN(num) || num < 0) throw new InputError('invalid offset');
    offset = num;
  }

  const sortRaw = searchParams.get('sort') ?? 'semver:desc';
  if (!(sortRaw in ORDER_BY)) {
    throw new InputError('invalid sort');
  }
  const sort = sortRaw as Sort;

  const qRaw = searchParams.get('q');
  const q = qRaw ? qRaw.trim() : undefined;

  return { limit, offset, sort, q };
}

export async function GET(req: Request) {
  try {
    const { limit, offset, sort, q } = parseQuery(req.url);
    console.log('[API:/releases] params', { limit, offset, sort, q }); // eslint-disable-line no-console

    const conditions: string[] = [];
    const values: Array<string | number> = [];
    const countConditions: string[] = [];
    const countValues: Array<string> = [];

    if (q) {
      values.push(`%${q}%`);
      countValues.push(`%${q}%`);
      const p = `$${values.length}`;
      conditions.push(`release_name ILIKE ${p}`);
      countConditions.push(`release_name ILIKE $${countValues.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countWhere = countConditions.length ? `WHERE ${countConditions.join(' AND ')}` : '';

    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const orderClause = ORDER_BY[sort];

    const sqlItems = `
      SELECT
        id,
        release_name AS name,
        status,
        release_type AS type,
        semver,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int AS sem_major,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int AS sem_minor,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int AS sem_patch,
        COALESCE((regexp_match(regexp_replace(semver, '^[^0-9]*', ''), '\\+([0-9]+)$'))[1]::int, 0) AS sem_hotfix
      FROM dojo.v_shaolin_scrolls
      ${where}
      ${orderClause}
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

    const sqlCount = `
      SELECT COUNT(*)::int AS total
      FROM dojo.v_shaolin_scrolls
      ${countWhere};
    `;

    const db = getPool();
    await db.query('SELECT 1');

    const [itemsRes, countRes]: [QueryResult<ReleaseItem>, QueryResult<{ total: number }>] =
      await Promise.all([db.query(sqlItems, values), db.query(sqlCount, countValues)]);

    const items = itemsRes.rows.map((row) => ({
      ...row,
      id: String(row.id),
    }));

    const total = countRes.rows[0]?.total ?? 0;
    const page: PageMeta = { limit, offset, total, sort };
    if (q) page.q = q;

    return NextResponse.json(
      { items, page } as ReleaseListResponse,
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    if (err instanceof InputError) {
      console.error('[API:/releases] bad input', err); // eslint-disable-line no-console
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[API:/releases] unexpected error', err); // eslint-disable-line no-console
    logger.error('[API:/releases] unexpected error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

