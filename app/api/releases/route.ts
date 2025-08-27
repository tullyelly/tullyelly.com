import { NextResponse } from 'next/server';
import { logger } from '@/app/lib/server-logger';
import { getPool } from '@/db/pool';
import type { ReleaseRow, PageMeta, ReleaseListResponse } from '@/types/releases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SORTABLE_COLUMNS = new Set(['name', 'status', 'type', 'semver']);
const SORT_DIRECTIONS = new Set(['asc', 'desc']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    let sort = searchParams.get('sort') || 'semver:desc';
    let [sortCol, sortDir] = sort.split(':');
    if (!SORTABLE_COLUMNS.has(sortCol) || !SORT_DIRECTIONS.has((sortDir || '').toLowerCase())) {
      sortCol = 'semver';
      sortDir = 'desc';
      sort = 'semver:desc';
    } else {
      sortDir = sortDir.toLowerCase();
      sort = `${sortCol}:${sortDir}`;
    }
    const qRaw = searchParams.get('q')?.trim();
    const q = qRaw ? qRaw : undefined;

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

    let orderClause: string;
    if (sortCol === 'semver') {
      orderClause = `ORDER BY sem_major ${sortDir}, sem_minor ${sortDir}, sem_patch ${sortDir}, sem_hotfix ${sortDir}`;
    } else if (sortCol === 'name') {
      orderClause = `ORDER BY release_name ${sortDir}`;
    } else if (sortCol === 'status') {
      orderClause = `ORDER BY status ${sortDir}`;
    } else if (sortCol === 'type') {
      orderClause = `ORDER BY release_type ${sortDir}`;
    } else {
      orderClause = `ORDER BY sem_major DESC, sem_minor DESC, sem_patch DESC, sem_hotfix DESC`;
    }

    const sqlItems = `
      SELECT
        id,
        release_name AS name,
        status,
        release_type AS type,
        semver,
        split_part(semver, '.', 1)::int AS sem_major,
        split_part(semver, '.', 2)::int AS sem_minor,
        split_part(split_part(semver, '.', 3), '+', 1)::int AS sem_patch,
        COALESCE((regexp_match(semver, '\\+([0-9]+)$'))[1]::int, 0) AS sem_hotfix
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
    const [itemsRes, countRes] = await Promise.all([
      db.query<ReleaseRow>(sqlItems, values),
      db.query<{ total: number }>(sqlCount, countValues),
    ]);

    const items = itemsRes.rows.map((row) => ({
      ...row,
      id: String(row.id),
    }));

    const total = countRes.rows[0]?.total || 0;
    const page: PageMeta = { limit, offset, total, sort };
    if (q) page.q = q;

    return NextResponse.json({ items, page } as ReleaseListResponse);
  } catch (err) {
    logger.error('[API:/releases]', err);
    return NextResponse.json({ error: 'database error' }, { status: 500 });
  }
}
