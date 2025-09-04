import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// curl -s http://localhost:3000/api/shaolin-scrolls/1 | jq

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const sql = 'SELECT * FROM dojo.v_shaolin_scrolls WHERE id = $1;';
  const db = getPool();
  try {
    const { rows } = await db.query(sql, [id]);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ row });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

