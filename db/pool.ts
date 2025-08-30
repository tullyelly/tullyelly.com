import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { Env } from '@/lib/env';
import { assertValidDatabaseUrl } from '@/db/assert-database-url';

type Query = <T extends QueryResultRow = QueryResultRow>(
  sql: string | { text: string },
  values?: unknown[]
) => Promise<QueryResult<T>>;
type PoolLike = { query: Query; end?: () => Promise<void> };

let pool: PoolLike | undefined;

export function getPool(): PoolLike {
  if (!pool) {
    if (Env.E2E_MODE === '1') {
      pool = {
        async query<T extends QueryResultRow = QueryResultRow>(
          sql: string | { text?: string }
        ): Promise<QueryResult<T>> {
          const text = typeof sql === 'string' ? sql : sql?.text ?? '';
          if (/select\s+1/i.test(text)) {
            return {
              rows: [{ '?column?': 1 } as unknown as T],
              rowCount: 1,
              command: '',
              oid: 0,
              fields: [],
            };
          }
          return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
        },
      };
    } else {
      if (!Env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Set it in .env.local');
      assertValidDatabaseUrl(Env.DATABASE_URL);
      const user = new URL(Env.DATABASE_URL).username;
      console.log(`DB user: ${user}`);
      const real = new Pool({ connectionString: Env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      pool = { query: real.query.bind(real), end: real.end.bind(real) };
    }
  }
  return pool;
}
