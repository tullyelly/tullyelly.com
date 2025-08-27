import { Pool } from 'pg';
import { DATABASE_URL } from '@/lib/env';
import { assertValidDatabaseUrl } from '@/db/assert-database-url';

let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    if (!DATABASE_URL) throw new Error('Missing DATABASE_URL. Set it in .env.local');
    assertValidDatabaseUrl(DATABASE_URL);
    const user = new URL(DATABASE_URL).username;
    console.log(`DB user: ${user}`);
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
