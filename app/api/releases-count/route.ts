import { getPool } from '@/db/pool';
import type { QueryResult } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getPool();
    const res: QueryResult<{ count: number }> = await db.query('SELECT COUNT(*)::int AS count FROM dojo.v_shaolin_scrolls;');
    return Response.json({ count: res.rows[0]?.count ?? 0 });
  } catch (err) {
    console.error('releases-count failed:', err);
    return Response.json({ count: 0, error: 'database error' }, { status: 500 });
  }
}

