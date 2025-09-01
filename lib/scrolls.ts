import 'server-only';

import { cache } from 'react';
import { getPool } from '@/db/pool';

export type ScrollDbRow = {
  id: string | number;
  name: string;
  status: string;
  type: string;
  semver: string;
  created_at: Date | string;
};

export type ScrollRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  semver: string;
  created_at: string;
};

export const getScrolls = cache(async function getScrolls({
  limit = 20,
  q,
}: {
  limit?: number;
  q?: string;
} = {}): Promise<ScrollRow[]> {
  const db = getPool();

  const values: Array<string | number> = [];
  const conditions: string[] = [];

  if (q && q.trim()) {
    values.push(`%${q.trim()}%`);
    const p = `$${values.length}`;
    conditions.push(`release_name ILIKE ${p}`);
  }

  values.push(limit);
  const limitParam = values.length;

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order by semver (major, minor, patch, hotfix) descending, fallback created_at
  const orderClause = `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int DESC,
    created_at DESC, id DESC`;

  const sql = `
    SELECT
      id,
      release_name AS name,
      status,
      release_type AS type,
      semver,
      created_at
    FROM dojo.v_shaolin_scrolls
    ${where}
    ${orderClause}
    LIMIT $${limitParam};
  `;

  await db.query('SELECT 1');
  const res = await db.query<ScrollDbRow>(sql, values);

  return res.rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    status: row.status,
    type: row.type,
    semver: row.semver,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
});

