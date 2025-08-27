import type { NextRequest } from 'next/server';
import { getPool } from '@/db/pool';
import { logger } from '@/app/lib/server-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<Record<string, string>> };

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
  created_at: string | Date;
  created_by: string | null;
  updated_at: string | Date | null;
  updated_by: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
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
    const db = getPool();
    const { rows } = await db.query<ReleaseRow>(sql, [numId]);
    const row = rows[0];
    if (!row) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }
    return Response.json({
      ...row,
      description: row.label,
      jira: [],
      commits: [],
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
      updated_at:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : row.updated_at,
    });
  } catch (err) {
    logger.error('releases id query failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}
