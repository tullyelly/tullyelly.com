import { NextResponse } from 'next/server';
import { logger } from '@/app/lib/server-logger';
import { getPool } from '@/db/pool';
import type { ReleaseListItem, PageMeta, ReleaseListResponse } from '@/types/releases';

type RawReleaseItem = Omit<ReleaseListItem, 'created_at'> & { created_at: Date | string };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SORTABLE_COLUMNS = new Set(['created_at', 'release_name', 'status', 'release_type']);
const SORT_DIRECTIONS = new Set(['asc', 'desc']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    let sort = searchParams.get('sort') || 'created_at:desc';
    let [sortCol, sortDir] = sort.split(':');
    if (!SORTABLE_COLUMNS.has(sortCol) || !SORT_DIRECTIONS.has((sortDir || '').toLowerCase())) {
      sortCol = 'created_at';
      sortDir = 'desc';
      sort = 'created_at:desc';
    } else {
      sortDir = sortDir.toLowerCase();
      sort = `${sortCol}:${sortDir}`;
    }
    const qRaw = searchParams.get('q')?.trim();
    const q = qRaw ? qRaw : undefined;

    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (q) {
      values.push(`%${q}%`);
      conditions.push(`release_name ILIKE $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const sqlItems = `
      SELECT id, release_name, status, release_type, created_at, semver
      FROM dojo.v_shaolin_scrolls
      ${where}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

    const countValues = q ? [`%${q}%`] : [];
    const sqlCount = `
      SELECT COUNT(*)::int AS total
      FROM dojo.v_shaolin_scrolls
      ${where};
    `;

    const db = getPool();
    const [itemsRes, countRes] = await Promise.all([
      db.query<RawReleaseItem>(sqlItems, values),
      db.query<{ total: number }>(sqlCount, countValues),
    ]);

    const items: ReleaseListItem[] = itemsRes.rows.map((row) => ({
      ...row,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
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
