import { Pool } from 'pg';
import { DATABASE_URL } from '@/lib/env';

let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    if (!DATABASE_URL) throw new Error('Missing DATABASE_URL');
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
