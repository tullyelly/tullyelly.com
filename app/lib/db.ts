import 'server-only';
import { Pool } from 'pg';
import { getDatabaseUrl, getRuntimeEnv } from './env';

let _pool: Pool | null = null;

function assertDbSafety(dbUrl: string) {
  const { vercelEnv } = getRuntimeEnv();
  const host = new URL(dbUrl).hostname;
  const allow: Record<typeof vercelEnv, string[]> = {
    development: ['ep-round-forest-aeuxacm9.c-2.us-east-2.aws.neon.tech'],
    preview: ['ep-steep-frog-ae7rg845.c-2.us-east-2.aws.neon.tech'],
    production: ['ep-jolly-flower-ae4bmy06.c-2.us-east-2.aws.neon.tech'],
  };
  if (!allow[vercelEnv].includes(host)) {
    throw new Error(`Safety check failed: ${vercelEnv} runtime cannot use DB host "${host}".`);
  }
  // swap any env var locally to verify the error above is thrown
}

export function getPool() {
  if (_pool) return _pool;
  const dbUrl = getDatabaseUrl();
  assertDbSafety(dbUrl);
  const { vercelEnv } = getRuntimeEnv();
  if (vercelEnv !== 'production') {
    console.debug('[env]', vercelEnv, new URL(dbUrl).hostname);
  }
  _pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

export function query<T>(text: string, params?: any[]) {
  return getPool().query<T>(text, params);
}
