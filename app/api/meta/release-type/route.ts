import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';
import type { QueryResult } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Row { id: number; code: string }

export async function GET() {
  const sql = 'SELECT id, code FROM dojo.release_type ORDER BY id';
  try {
    const db = getPool();
    const res: QueryResult<Row> = await db.query(sql);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('[meta/release-type] db error', err);
    return NextResponse.json({ error: 'database error' }, { status: 500 });
  }
}
