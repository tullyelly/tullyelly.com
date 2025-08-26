import { query } from '@/app/lib/db';

// curl -s 'http://localhost:3000/api/releases?limit=5'

export interface Row {
  id: number;
  release_name: string;
  semver: string;
  status: string;
  release_type: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  let limit = Number.parseInt(limitParam ?? '20', 10);
  let offset = Number.parseInt(offsetParam ?? '0', 10);

  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  if (limit > 100) limit = 100;

  try {
    const sql =
      'SELECT id, release_name, semver, status, release_type\n' +
      '  FROM dojo.v_shaolin_scrolls\n' +
      '  ORDER BY created_at DESC\n' +
      '  LIMIT $1 OFFSET $2;';
    const { rows } = await query<Row>(sql, [limit, offset]);
    return Response.json({ items: rows, page: { limit, offset } });
  } catch (err) {
    console.error('releases query failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}

