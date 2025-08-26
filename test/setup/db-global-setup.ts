import 'dotenv/config';
import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

type AnyErr = unknown;

function messageOf(err: AnyErr): string {
  if (!err) return 'Unknown error';
  if (err instanceof AggregateError) {
    const msgs = Array.from(err.errors ?? []).map(messageOf);
    return `AggregateError: ${msgs.join(' | ')}`;
  }
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  try { return JSON.stringify(err); } catch { return String(err); }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  const to = delay(ms).then(() => {
    throw new Error(`${label} timed out after ${ms}ms`);
  });
  return Promise.race([p, to]) as Promise<T>;
}

export default async function globalSetup() {
  if (fs.existsSync('.env.test')) {
    // dotenv/config already loaded; presence check clarifies intent
  }

  const url = process.env.TEST_DATABASE_URL?.trim();
  const allowDockerFallback = (process.env.DOCKER_FALLBACK ?? 'false').toLowerCase() !== 'false';

  if (url) {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: url, max: 1, idleTimeoutMillis: 1000, allowExitOnIdle: true });

    try {
      const client = await withTimeout(pool.connect(), 5000, 'Postgres connect');
      try {
        const res = await withTimeout(client.query('select 1 as ok'), 3000, 'Smoke query');
        if (!res?.rows?.[0]?.ok) throw new Error('Smoke query failed (no rows)');
      } finally {
        client.release();
      }
    } catch (e) {
      await pool.end().catch(() => void 0);
      const msg = messageOf(e);
      throw new Error(
        `Cannot connect to TEST_DATABASE_URL. Check credentials, network, and DB reachability.\n` +
        `TEST_DATABASE_URL=${url}\n` +
        `Cause → ${msg}`
      );
    }

    (global as any).__db = { kind: 'pg', url };
    return;
  }

  if (!allowDockerFallback) {
    throw new Error(
      'TEST_DATABASE_URL is not set and DOCKER_FALLBACK is disabled.\n' +
      'Create .env.test with TEST_DATABASE_URL to run DB tests without Docker.'
    );
  }

  try {
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
    const container = await withTimeout(
      new PostgreSqlContainer().withStartupTimeout(60_000).start(),
      70_000,
      'Testcontainers startup'
    );

    const urlFromTc = container.getConnectionUri();
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: urlFromTc, max: 1, idleTimeoutMillis: 1000, allowExitOnIdle: true });

    const client = await withTimeout(pool.connect(), 5000, 'TC Postgres connect');
    try { await withTimeout(client.query('select 1'), 3000, 'TC smoke query'); }
    finally { client.release(); }

    (global as any).__db = { kind: 'tc', container, pool, url: urlFromTc };
  } catch (e) {
    const msg = messageOf(e);
    throw new Error(
      'Failed to start Testcontainers fallback.\n' +
      'Either set TEST_DATABASE_URL in .env.test or ensure Docker is installed and running.\n' +
      `Cause → ${msg}`
    );
  }
}
