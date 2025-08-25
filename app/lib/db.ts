import 'server-only';

import { Pool } from 'pg';

let pool: Pool | undefined;

function redact(url: string) {
  return url.replace(/:[^:@]*@/, ':***@');
}

function assertDbSafety(url: string) {
  const prodHost = /neon-prod-host/i;
  const devHost = /neon-dev-host/i;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && devHost.test(url)) {
    throw new Error('Refusing to use dev database in production runtime');
  }

  if (!isProd && prodHost.test(url)) {
    throw new Error('Refusing to use prod database outside production runtime');
  }
}

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  assertDbSafety(connectionString);

  const max = process.env.NODE_ENV === 'production' ? 10 : 5;
  const newPool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max });

  newPool.on('error', (err) => {
    console.error('database connection error', {
      message: err.message,
      database: redact(connectionString),
    });
  });

  pool = newPool;
  return pool;
}

export async function query<T>(text: string, params: any[] = []): Promise<{ rows: T[] }> {
  const result = await getPool().query<T>(text, params);
  return { rows: result.rows };
}

export { assertDbSafety };
