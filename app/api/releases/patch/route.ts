import { getPool } from '@/db/pool';
import { logger } from '@/app/lib/server-logger';
import type { QueryResult } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// curl -s -X POST -H 'Content-Type: application/json' \
//   -d '{"label":"First hotfix"}' http://localhost:3000/api/releases/patch

interface DbRow {
  scroll_id: number;
  generated_name: string;
}

export type Row = {
  id: string;
  generated_name: string;
};

export async function POST(req: Request) {
  let label: string;
  try {
    const body = await req.json();
    label = typeof body.label === 'string' ? body.label.trim() : '';
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!label || label.length > 120) {
    return Response.json({ error: 'invalid label' }, { status: 400 });
  }

  const sql = 'SELECT * FROM dojo.fn_next_patch($1::text);';
  try {
    const db = getPool();
    const res: QueryResult<DbRow> = await db.query(sql, [label]);
    const row = res.rows[0];
    const item: Row = { id: String(row.scroll_id), generated_name: row.generated_name };
    return Response.json(item);
  } catch (err) {
    logger.error('fn_next_patch failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}

