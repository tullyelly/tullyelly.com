import 'server-only';

import { getPool } from '@/db/pool';
import { ORDER_BY, type Sort } from '@/lib/releases';

export type ScrollDbRow = {
  id: string | number;
  label: string;
  status: string;
  type: string;
  release_date: Date | string | null;
};

export type ScrollRow = {
  id: string;
  label: string;
  status: string;
  type: string;
  release_date: string | null;
};

export interface ScrollsPageParams {
  limit?: number;
  offset?: number;
  sort?: Sort;
  q?: string;
}

export interface ScrollsPageResponse {
  items: ScrollRow[];
  page: { limit: number; offset: number; total: number; sort: Sort; q?: string };
}

export async function getScrollsPage({
  limit = 20,
  offset = 0,
  sort = 'semver:desc',
  q,
}: ScrollsPageParams): Promise<ScrollsPageResponse> {
  const db = getPool();

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
        release_name AS label,
        status,
        release_type AS type,
        release_date
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

  await db.query('SELECT 1');

  const [itemsRes, countRes] = await Promise.all([
    db.query<ScrollDbRow>(sqlItems, values),
    db.query<{ total: number }>(sqlCount, countValues),
  ]);

  const items: ScrollRow[] = itemsRes.rows.map((row) => ({
    id: String(row.id),
    label: row.label,
    status: row.status,
    type: row.type,
    release_date:
      row.release_date instanceof Date
        ? row.release_date.toISOString()
        : row.release_date ?? null,
  }));

  const total = countRes.rows[0]?.total ?? 0;
  const page = { limit, offset, total, sort } as ScrollsPageResponse['page'];
  if (q) page.q = q;

  return { items, page };
}

export async function getScrolls(params: { limit?: number; q?: string } = {}): Promise<ScrollRow[]> {
  const { items } = await getScrollsPage({ limit: params.limit, offset: 0, sort: 'semver:desc', q: params.q });
  return items;
}
