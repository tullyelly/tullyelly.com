import { Client, QueryResult } from 'pg';
import { assertValidDatabaseUrl } from '@/db/assert-database-url';
import { serverEnv } from '@/lib/env/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function redact(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    const hasUser = Boolean(url.username);
    return `${url.protocol}//${hasUser ? '****@' : ''}${url.host}${url.pathname}`;
  } catch {
    return 'INVALID_URL';
  }
}

type DbMetaRow = { db: string; usr: string; host_ip: string };

export async function GET() {
  const { VERCEL_ENV, NODE_ENV, DATABASE_URL } = serverEnv({ strict: true });
  const vercelEnv = VERCEL_ENV ?? NODE_ENV ?? 'unknown';
  const raw = DATABASE_URL ?? null;
  assertValidDatabaseUrl(raw);
  const safe = redact(raw);

  try {
    if (!raw || safe === 'INVALID_URL') {
      return Response.json(
        { ok: false, reason: 'NO_OR_BAD_DATABASE_URL', vercelEnv, databaseUrlRedacted: safe },
        { status: 500 },
      );
    }

    const client = new Client({
      connectionString: raw,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    const metaRes: QueryResult<DbMetaRow> = await client.query(
      `SELECT current_database() AS db,
              current_user       AS usr,
              inet_server_addr()::text AS host_ip`
    );
    const countRes: QueryResult<{ count: number }> = await client.query(
      `SELECT COUNT(*)::int AS count FROM dojo.v_shaolin_scrolls`
    );

    await client.end();

    const meta = metaRes.rows[0];
    const count = countRes.rows[0]?.count ?? 0;

    return Response.json({
      ok: true,
      vercelEnv,
      databaseUrlRedacted: safe,
      meta,
      rowsInView: count,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, reason: 'QUERY_FAILED', message, vercelEnv, databaseUrlRedacted: safe },
      { status: 500 },
    );
  }
}
