import 'server-only';
import { getPool } from '@/db/pool';

type ReleaseRow = {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  created_at: string;
};

type RawReleaseRow = {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  created_at: Date | string;
};

export async function getReleases(limit = 20): Promise<ReleaseRow[]> {
  if (process.env.USE_FAKE_DATA === '1') {
    return [
      {
        id: 1,
        release_name: 'v0.0.1 Stub',
        status: 'planned',
        release_type: 'minor',
        created_at: new Date().toISOString(),
      },
    ];
  }

  const db = getPool();
  const { rows } = await db.query<RawReleaseRow>(
    'select id, release_name, status, release_type, created_at from dojo.v_shaolin_scrolls order by created_at desc limit $1',
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map((row) => ({
    id: row.id,
    release_name: row.release_name,
    status: row.status,
    release_type: row.release_type,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}
