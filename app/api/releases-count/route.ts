import { getPool } from '@/db/pool';
import { logger } from '@/app/lib/server-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getPool();
    const { rows } = await db.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM dojo.v_shaolin_scrolls;');
    return Response.json({ count: rows[0]?.count ?? 0 });
  } catch (err) {
    logger.error('releases-count failed:', err);
    return Response.json({ count: 0, error: 'database error' }, { status: 500 });
  }
}

