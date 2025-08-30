'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getPool } from '@/db/pool';

export const ORDER_BY = {
  'semver:desc': `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int DESC,
    created_at DESC, id DESC`,
  'semver:asc': `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int ASC,
    created_at DESC, id DESC`,
  'created_at:desc': 'ORDER BY created_at DESC, id DESC',
  'created_at:asc': 'ORDER BY created_at ASC, id ASC',
} as const;

export type Sort = keyof typeof ORDER_BY;

interface DbReleaseRow {
  id: string | number;
  name: string;
  status: string;
  type: string;
  semver: string;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix: number;
  created_at: Date;
}

export interface ReleaseRow {
  id: string;
  name: string;
  status: string;
  type: string;
  semver: string;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix: number;
  created_at: string;
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  sort: string;
  q?: string;
}

export interface ReleaseListParams {
  limit: number;
  offset: number;
  sort: Sort;
  q?: string;
}

export interface ReleaseListResponse {
  items: ReleaseRow[];
  page: PageMeta;
}

export async function getReleases({ limit, offset, sort, q }: ReleaseListParams): Promise<ReleaseListResponse> {
  noStore();

  const conditions: string[] = [];
  const values: Array<string | number> = [];
  const countConditions: string[] = [];
  const countValues: Array<string> = [];

  if (q) {
    values.push(`%${q}%`);
    countValues.push(`%${q}%`);
    const p = `$${values.length}`;
    conditions.push(`release_name ILIKE ${p}`);
    countConditions.push(`release_name ILIKE $${countValues.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countWhere = countConditions.length ? `WHERE ${countConditions.join(' AND ')}` : '';

  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const orderClause = ORDER_BY[sort];

  const sqlItems = `
      SELECT
        id,
        release_name AS name,
        status,
        release_type AS type,
        semver,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int AS sem_major,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int AS sem_minor,
        COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int AS sem_patch,
        COALESCE((regexp_match(regexp_replace(semver, '^[^0-9]*', ''), '\\+([0-9]+)$'))[1]::int, 0) AS sem_hotfix,
        created_at
      FROM dojo.v_shaolin_scrolls
      ${where}
      ${orderClause}
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

  const sqlCount = `
      SELECT COUNT(*)::int AS total
      FROM dojo.v_shaolin_scrolls
      ${countWhere};
    `;

  const db = getPool();
  await db.query('SELECT 1');

  const [itemsRes, countRes] = await Promise.all([
    db.query<DbReleaseRow>(sqlItems, values),
    db.query<{ total: number }>(sqlCount, countValues),
  ]);

  const items: ReleaseRow[] = itemsRes.rows.map(row => ({
    ...row,
    id: String(row.id),
    created_at: new Date(row.created_at).toISOString(),
  }));

  const total = countRes.rows[0]?.total ?? 0;
  const page: PageMeta = { limit, offset, total, sort };
  if (q) page.q = q;

  return { items, page };
}
