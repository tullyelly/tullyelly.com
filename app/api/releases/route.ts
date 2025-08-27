import { query } from '@/app/lib/db';
import { logger } from '@/app/lib/server-logger';

// curl -s 'http://localhost:3000/api/releases?limit=5'

interface DbRow {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  semver: string;
}

export type Row = {
  id: string;
  release_name: string;
  status: string;
  release_type: string;
  semver: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  let limit = Number.parseInt(limitParam ?? '20', 10);
  let offset = Number.parseInt(offsetParam ?? '0', 10);

  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  if (limit > 100) limit = 100;

  const sql = `
SELECT
  id,
  release_name,
  status,
  release_type,
  semver
FROM dojo.v_shaolin_scrolls
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
`;

  try {
    const { rows } = await query<DbRow>(sql, [limit, offset]);
    const items: Row[] = rows.map((r) => ({
      id: String(r.id),
      release_name: r.release_name,
      status: r.status,
      release_type: r.release_type,
      semver: r.semver,
    }));
    return Response.json({ items, page: { limit, offset } });
  } catch (err) {
    logger.error('releases query failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}
