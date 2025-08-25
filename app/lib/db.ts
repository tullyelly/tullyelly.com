import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

// Known Neon hosts (no secrets). Update if you ever rotate hosts.
const PROD_HOST    = 'ep-jolly-flower-ae4bmy06.c-2.us-east-2.aws.neon.tech';
const PREVIEW_HOST = 'ep-steep-frog-ae7rg845.c-2.us-east-2.aws.neon.tech';
const TEST_HOST    = 'ep-round-forest-aeuxacm9.c-2.us-east-2.aws.neon.tech';

function assertDbSafety(url: string) {
  // Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development'
  const env = process.env.VERCEL_ENV ?? 'development';
  const hostname = new URL(url).hostname;

  const isProdHost    = hostname === PROD_HOST;
  const isPreviewHost = hostname === PREVIEW_HOST;
  const isTestHost    = hostname === TEST_HOST;

  // --- Hard rules ---
  if (env === 'production' && !isProdHost) {
    throw new Error(
      `Safety check failed: production runtime cannot use ${hostname}. Expected ${PROD_HOST}.`
    );
  }

  if (env === 'preview') {
    if (isProdHost) {
      throw new Error('Safety check failed: preview runtime cannot point at the production database.');
    }
    // Optionally enforce preview host strictly:
    // if (!isPreviewHost) {
    //   throw new Error(`Preview runtime expected ${PREVIEW_HOST}, got ${hostname}.`);
    // }
  }

  if (env === 'development' && isProdHost) {
    throw new Error('Safety check failed: development runtime cannot point at the production database.');
  }
}

// ...existing code above...

export function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not defined');
  assertDbSafety(url);
  pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: process.env.VERCEL_ENV === 'production' ? 10 : 5,
  });
  return pool;
}

export async function query<T = any>(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query<T>(text, params);
    return { rows: result.rows };
  } catch (err: any) {
    console.error('Database query error:', { message: err?.message ?? 'unknown error' });
    throw err;
  } finally {
    client.release();
  }
}

// ✅ added for test teardown and CI
export async function endPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}