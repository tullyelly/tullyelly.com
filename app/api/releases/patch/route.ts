import { getPool } from '@/db/pool';
import type { QueryResult } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// curl -s -X POST -H 'Content-Type: application/json' \
//   -d '{"label":"First hotfix","statusCode":"planned","releaseTypeCode":"hotfix"}' http://localhost:3000/api/releases/patch

interface DbRow {
  scroll_id: number;
  generated_name: string;
}

export type Row = {
  id: string;
  generated_name: string;
};

type Body = {
  label: string;
  statusCode: string;
  releaseTypeCode: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const status = typeof body.statusCode === 'string' ? body.statusCode.trim() : '';
  const rtype = typeof body.releaseTypeCode === 'string' ? body.releaseTypeCode.trim() : '';

  if (!label || label.length > 120 || !status || !rtype) {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }

  const sql = 'SELECT * FROM dojo.fn_next_patch($1::text, $2::text, $3::text);';
  try {
    const db = getPool();
    const res: QueryResult<DbRow> = await db.query(sql, [label, status, rtype]);
    const row = res.rows[0];
    const item: Row = { id: String(row.scroll_id), generated_name: row.generated_name };
    return Response.json(item);
  } catch (err) {
    console.error('fn_next_patch failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}
