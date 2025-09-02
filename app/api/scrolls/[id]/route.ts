import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// curl -s http://localhost:3000/api/scrolls/1

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const sql = `
    select
      ss.id,
      ss.label,
      ss.major, ss.minor, ss.patch,
      ss.year, ss.month,
      ss.release_date,
      rs.name as status_name,
      rt.name as type_name
    from shaolin_scrolls ss
    join release_status rs on rs.id = ss.release_status_id
    join release_type rt on rt.id = ss.release_type_id
    where ss.id = $1
  `;

  const db = getPool();
  const { rows } = await db.query(sql, [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const r = rows[0];
  const semver = `${r.major}.${r.minor}.${r.patch}`;
  return NextResponse.json({
    id: r.id,
    label: r.label,
    semver,
    status: r.status_name,
    type: r.type_name,
    year: r.year,
    month: r.month,
    release_date: r.release_date,
  });
}
