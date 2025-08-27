import 'server-only';
import { getPool } from '@/db/pool';

export async function getReleases(limit = 20) {
  const db = getPool();
  const { rows } = await db.query(
    'select * from shaolin_scrolls.releases order by created_at desc limit $1',
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}
