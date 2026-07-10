import { NextResponse } from "next/server";
import { getPool } from "@/db/pool";
import {
  isDbSkipEnabled,
  isDebugDbMetadataEnabled,
} from "@/lib/escape-hatches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function sanitize(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\//, "");
    return { host: u.host, db };
  } catch {
    return { raw: "<unparseable DATABASE_URL>" };
  }
}

export async function GET() {
  if (!isDebugDbMetadataEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  if (isDbSkipEnabled()) {
    return NextResponse.json(
      { ok: false, reason: "Database access disabled in CI." },
      { status: 503 },
    );
  }
  const pool = getPool();
  const meta = await pool.query(`
    SELECT
      current_database()               AS database,
      current_user                     AS "user",
      current_setting('search_path')   AS search_path,
      current_setting('application_name', true) AS app_name
  `);
  const tables = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name IN ('users','accounts','sessions','verification_tokens')
    ORDER BY table_schema, table_name
  `);
  return NextResponse.json({
    env_seen: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      DATABASE_URL: sanitize(process.env.DATABASE_URL),
    },
    db_seen: meta.rows[0],
    tables: tables.rows,
  });
}
