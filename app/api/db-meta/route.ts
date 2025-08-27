// app/api/db-meta/route.ts (Next.js App Router)
import { Pool } from 'pg';

const url = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: url, max: 1 });

export async function GET() {
  const parsed = new URL(url);
  const redacted = `${parsed.protocol}//${parsed.username ? '****@' : ''}${parsed.host}${parsed.pathname}`;
  const { rows } = await pool.query(`
    select
      current_database() as db,
      current_user as usr,
      inet_server_addr()::text as host_ip,
      version() as version
  `);
  return new Response(
    JSON.stringify({
      vercelEnv: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      databaseUrlHost: parsed.host,     // good enough to tell prod vs staging
      databaseUrlRedacted: redacted,    // safe to log to client
      meta: rows[0],
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}