import { getPool } from '@/db/pool';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getPool();
  const res = await db.query('SELECT id, code FROM dojo.release_type ORDER BY code ASC;');
  return NextResponse.json(res.rows);
}
