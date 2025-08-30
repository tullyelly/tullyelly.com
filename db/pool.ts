import { Pool } from 'pg';
import { DATABASE_URL } from '@/lib/env';
import { assertValidDatabaseUrl } from '@/db/assert-database-url';

interface Queryable {
  query<T = any>(sql: any, values?: any[]): Promise<any>;
  end?: () => Promise<void>;
}

let pool: Queryable | undefined;

if (process.env.E2E_MODE === '1') {
  pool = {
    async query<T = any>(sql: any): Promise<any> {
      const text = typeof sql === 'string' ? sql : sql?.text ?? '';
      if (/select\s+1/i.test(text)) {
        return { rows: [{ '?column?': 1 } as unknown as T], rowCount: 1 };
      }
      return { rows: [] as T[], rowCount: 0 };
    },
    async end() {
      return Promise.resolve();
    },
  };
}

export function getPool(): Queryable {
  if (pool) return pool;
  if (!DATABASE_URL) throw new Error('Missing DATABASE_URL. Set it in .env.local');
  assertValidDatabaseUrl(DATABASE_URL);
  const user = new URL(DATABASE_URL).username;
  console.log(`DB user: ${user}`);
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}
