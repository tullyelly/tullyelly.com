import 'server-only';
import { Pool } from 'pg';

function getDbUrl(): string {
  const env = process.env.NODE_ENV;
  if (env === 'test') {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error('Missing TEST_DATABASE_URL for db test project');
    }
    return url;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing DATABASE_URL');
  }
  return url;
}

const connectionString = getDbUrl();

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export async function withClient<T>(fn: (q: (sql: string, params?: any[]) => Promise<any>) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    const q = async (sql: string, params?: any[]) => client.query(sql, params);
    return await fn(q);
  } finally {
    client.release();
  }
}
