import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getPool } from "@/db/pool";
import { asDateString } from "@/lib/dates";

export const ORDER_BY = {
  "semver:desc": `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int DESC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int DESC,
    created_at DESC,
    id DESC`,
  "semver:asc": `ORDER BY
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int ASC,
    COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int ASC,
    created_at DESC,
    id DESC`,
} as const;

export type Sort = keyof typeof ORDER_BY;

interface DbScrollRow {
  id: string | number;
  release_name: string;
  label: string | null;
  status: string;
  release_type: string;
  semver: string;
  created_at: Date;
  release_date: string | null;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix: number;
}

export interface ReleaseRow {
  id: string;
  name: string;
  label: string | null;
  status: string;
  type: string;
  semver: string;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix: number;
  created_at: string;
  release_date: string | null;
}

function toIsoString(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  sort: Sort;
  q?: string;
}

export interface ReleaseTypeRow {
  id: number;
  code: string;
}

export interface ScrollsPageParams {
  limit?: number;
  offset?: number;
  sort?: Sort;
  q?: string;
}

export interface ReleaseListResponse {
  items: ReleaseRow[];
  page: PageMeta;
}

export async function getReleaseTypes(): Promise<ReleaseTypeRow[]> {
  noStore();
  const db = getPool();
  await db.query("SELECT 1");
  const sql = `
    SELECT id, code
    FROM dojo.release_type
    ORDER BY id ASC;
  `;
  const res = await db.query<ReleaseTypeRow>(sql);
  return res.rows.map((row: ReleaseTypeRow) => ({
    id: Number(row.id),
    code: row.code,
  }));
}

function buildWhere(q?: string) {
  if (!q) {
    return {
      where: "",
      countWhere: "",
      values: [] as string[],
      countValues: [] as string[],
    };
  }
  const values = [`%${q}%`];
  const countValues = [`%${q}%`];
  const where = `WHERE release_name ILIKE $1`;
  const countWhere = `WHERE release_name ILIKE $1`;
  return { where, countWhere, values, countValues };
}

export async function getScrollsPage(
  params: ScrollsPageParams = {},
): Promise<ReleaseListResponse> {
  noStore();

  const { limit = 20, offset = 0, sort = "semver:desc", q } = params;

  const db = getPool();

  const { where, countWhere, values: queryValues, countValues } = buildWhere(q);

  const values: Array<string | number> = [...queryValues];

  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const orderClause = ORDER_BY[sort];

  const sqlItems = `
    SELECT
      id,
      release_name,
      label,
      status,
      release_type,
      semver,
      COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 1), ''), '0')::int AS sem_major,
      COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 2), ''), '0')::int AS sem_minor,
      COALESCE(NULLIF(split_part(regexp_replace(semver, '^[^0-9]*', ''), '.', 3), ''), '0')::int AS sem_patch,
      COALESCE((regexp_match(regexp_replace(semver, '^[^0-9]*', ''), '\\+([0-9]+)$'))[1]::int, 0) AS sem_hotfix,
      created_at,
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

  await db.query("SELECT 1");

  const [itemsRes, countRes] = await Promise.all([
    db.query<DbScrollRow>(sqlItems, values),
    db.query<{ total: number }>(sqlCount, [...countValues]),
  ]);

  const items: ReleaseRow[] = itemsRes.rows.map((row: DbScrollRow) => {
    return {
      id: String(row.id),
      name: row.release_name,
      label: row.label ?? row.release_name,
      status: row.status,
      type: row.release_type,
      semver: row.semver,
      sem_major: row.sem_major,
      sem_minor: row.sem_minor,
      sem_patch: row.sem_patch,
      sem_hotfix: row.sem_hotfix,
      created_at: toIsoString(row.created_at),
      release_date: asDateString(row.release_date),
    };
  });

  const total = countRes.rows[0]?.total ?? 0;
  const page: PageMeta = { limit, offset, total, sort };
  if (q) page.q = q;

  return { items, page };
}

export async function getScrolls(params: { limit?: number; q?: string } = {}) {
  const { limit = 20, q } = params;
  const { items } = await getScrollsPage({
    limit,
    offset: 0,
    sort: "semver:desc",
    q,
  });
  return items;
}

export interface ScrollDetail {
  id: string;
  release_name: string;
  release_type: string;
  status: string;
  release_date: string | null;
  label: string | null;
}

export async function getScroll(
  id: string | number,
): Promise<ScrollDetail | null> {
  const db = getPool();
  await db.query("SELECT 1");
  const sql = `
    SELECT id, release_name, release_type, status, release_date, label
    FROM dojo.v_shaolin_scrolls
    WHERE id = $1;
  `;
  const res = await db.query<{
    id: number | string;
    release_name: string;
    release_type: string;
    status: string;
    release_date: string | null;
    label: string | null;
  }>(sql, [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    release_name: row.release_name,
    release_type: row.release_type,
    status: row.status,
    release_date: asDateString(row.release_date),
    label: row.label,
  };
}
