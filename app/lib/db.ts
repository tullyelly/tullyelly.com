import 'server-only';
import { Pool } from 'pg';
import { getDatabaseUrl, getRuntimeEnv } from './env';

let _pool: Pool | null = null;

function assertDbSafety(dbUrl: string) {
  const { vercelEnv, nodeEnv } = getRuntimeEnv();
  const env = nodeEnv === 'test' ? 'development' : vercelEnv;
  const host = new URL(dbUrl).hostname;
  const allow: Record<'development' | 'preview' | 'production', string[]> = {
    development: [
      'ep-round-forest-aeuxacm9.c-2.us-east-2.aws.neon.tech',
      'localhost',
      '127.0.0.1',
    ],
    preview: ['ep-steep-frog-ae7rg845.c-2.us-east-2.aws.neon.tech'],
    production: ['ep-jolly-flower-ae4bmy06.c-2.us-east-2.aws.neon.tech'],
  };
  if (!allow[env].includes(host)) {
    throw new Error(`Safety check failed: ${env} runtime cannot use DB host "${host}".`);
  }
  // swap any env var locally to verify the error above is thrown
}

export function getPool() {
  if (_pool) return _pool;
  const dbUrl = getDatabaseUrl();
  assertDbSafety(dbUrl);
  const { vercelEnv, nodeEnv } = getRuntimeEnv();
  const env = nodeEnv === 'test' ? 'development' : vercelEnv;
  if (env !== 'production') {
    console.debug('[env]', env, new URL(dbUrl).hostname);
  }
  _pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
  return _pool;
}

export function query<T>(text: string, params?: any[]) {
  return getPool().query<T>(text, params);
}
