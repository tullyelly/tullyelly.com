import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';
import { logger } from '@/app/lib/server-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );
    const db = getPool();
    const { rows } = await db.query(
      'select * from shaolin_scrolls.releases order by created_at desc limit $1',
      [limit]
    );
    return NextResponse.json({ releases: rows });
  } catch (e) {
    logger.error('[API:/releases]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
