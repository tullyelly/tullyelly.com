import type { NextRequest } from 'next/server';
import { query } from '@/app/lib/db';

type RouteContext<Path extends string> = { params: Promise<Record<string, string>> };

// curl -s http://localhost:3000/api/releases/1

export interface ReleaseRow {
  id: number;
  release_name: string;
  semver: string;
  major: number;
  minor: number;
  patch: number;
  year: number;
  month: number;
  label: string | null;
  status: string;
  release_type: string;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<'/api/releases/[id]'>
) {
  const { id } = await params;
  const numId = Number.parseInt(id, 10);
  if (!Number.isInteger(numId)) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }

  const sql = `
  SELECT id, release_name, semver,
         major, minor, patch, year, month, label,
         status, release_type,
         created_at, created_by, updated_at, updated_by
  FROM dojo.v_shaolin_scrolls
  WHERE id = $1;`;

  try {
    const { rows } = await query<ReleaseRow>(sql, [numId]);
    const row = rows[0];
    if (!row) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }
    return Response.json(row);
  } catch (err) {
    console.error('releases id query failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}

