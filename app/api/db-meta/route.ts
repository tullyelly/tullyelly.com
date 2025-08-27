import { Pool } from 'pg';

export const runtime = 'nodejs';

export async function GET() {
  const vercelEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const url = process.env.DATABASE_URL;
  if (!url) {
    return Response.json({ vercelEnv, error: 'NO_OR_BAD_DATABASE_URL' }, { status: 500 });
  }

  let databaseUrlRedacted: string;
  try {
    const parsed = new URL(url);
    databaseUrlRedacted = `${parsed.protocol}//${parsed.username ? '****@' : ''}${parsed.host}${parsed.pathname}`;
  } catch {
    return Response.json({ vercelEnv, error: 'NO_OR_BAD_DATABASE_URL' }, { status: 500 });
  }

  const pool = new Pool({ connectionString: url, max: 1, ssl: { rejectUnauthorized: false } });
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    await pool.end();
    return Response.json(
      { vercelEnv, databaseUrlRedacted, error: 'CONNECTION_FAILED', reason: (err as Error).message },
      { status: 500 },
    );
  }

  try {
    const metaRes = await client.query<{ current_database: string; current_user: string; inet_server_addr: string }>(
      'SELECT current_database(), current_user, inet_server_addr()::text;',
    );
    const countRes = await client.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM dojo.v_shaolin_scrolls;');
    const meta = metaRes.rows[0] || { current_database: null, current_user: null, inet_server_addr: null };
    return Response.json({
      vercelEnv,
      databaseUrlRedacted,
      currentDatabase: meta.current_database,
      currentUser: meta.current_user,
      serverAddr: meta.inet_server_addr,
      rowsInView: countRes.rows[0]?.count ?? 0,
    });
  } catch (err) {
    return Response.json(
      { vercelEnv, databaseUrlRedacted, error: 'QUERY_FAILED', reason: (err as Error).message },
      { status: 500 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}

