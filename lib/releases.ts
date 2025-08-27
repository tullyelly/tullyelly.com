import 'server-only';
import { query } from '@/app/lib/db';
import { logger } from '@/app/lib/server-logger';

export interface ReleaseRow {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  semver: string;
  created_at: string;
}

export async function getReleases(limit = 20, offset = 0): Promise<ReleaseRow[]> {
  const boundedLimit = Math.min(Math.max(limit, 1), 100);
  const boundedOffset = Math.max(offset, 0);
  logger.log('[lib/releases] fetching releases', { limit: boundedLimit, offset: boundedOffset });
  const sql = `
SELECT id, release_name, status, release_type, semver, created_at
FROM dojo.v_shaolin_scrolls
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
`;
  try {
    const { rows } = await query<ReleaseRow>(sql, [boundedLimit, boundedOffset]);
    return rows;
  } catch (err) {
    logger.error('[lib/releases] query failed:', err);
    throw err;
  }
}
