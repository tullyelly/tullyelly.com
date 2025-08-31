import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
  type QueryConfig,
} from "pg";
import { getDatabaseUrl } from "@/lib/db-url";

declare global {
  var __PG_POOL__: Pool | undefined;
}

export const pool: Pool =
  global.__PG_POOL__ ?? new Pool({ connectionString: getDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  global.__PG_POOL__ = pool;
}

/**
 * Typed query helper.
 * T must extend QueryResultRow.
 */
export function query<T extends QueryResultRow = QueryResultRow>(
  config: QueryConfig<any[]>
): Promise<QueryResult<T>>;
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[] | undefined
): Promise<QueryResult<T>>;
export function query<T extends QueryResultRow = QueryResultRow>(
  textOrConfig: string | QueryConfig<any[]>,
  params?: any[] | undefined
): Promise<QueryResult<T>> {
  return typeof textOrConfig === "string"
    ? pool.query<T>(textOrConfig, params)
    : pool.query<T>(textOrConfig);
}

/**
 * Transaction helper.
 */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}