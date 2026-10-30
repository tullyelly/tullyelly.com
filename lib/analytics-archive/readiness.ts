import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { getPool } from "@/db/pool";
import { isNextBuild } from "@/lib/env";
import { buildInfo } from "@/lib/build-info";
import expectedSchema from "@/scripts/release-db-schema.json";
import { assertDay, utcDay, addDays } from "./client";
import {
  analyticsMigrations,
  type AnalyticsRuntimeState,
} from "./readiness-contract";

export function analyticsConnection(
  raw: string | undefined,
): Pick<AnalyticsRuntimeState, "connection" | "targetSha256"> {
  if (!raw) return { connection: "missing", targetSha256: null };
  try {
    const url = new URL(raw);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname.endsWith(".neon.tech") ||
      url.hash ||
      (url.port && url.port !== "5432") ||
      [...url.searchParams.keys()].some(
        (key) => !["sslmode", "channel_binding"].includes(key),
      )
    )
      throw new Error();
    const target = [
      url.hostname.toLowerCase().replace(/-pooler(?=\.)/, ""),
      decodeURIComponent(url.pathname.slice(1)),
      decodeURIComponent(url.username),
    ];
    return {
      connection: url.hostname.includes("-pooler.") ? "pooled" : "direct",
      targetSha256: createHash("sha256")
        .update(JSON.stringify(target))
        .digest("hex"),
    };
  } catch {
    return { connection: "invalid", targetSha256: null };
  }
}
function configured() {
  try {
    const floor = process.env.ANALYTICS_AVAILABLE_FROM ?? "";
    assertDay(floor);
    return (
      floor <= addDays(utcDay(new Date()), -1) &&
      Boolean(process.env.ANALYTICS_PROJECT_ID?.trim()) &&
      Boolean(process.env.ANALYTICS_VERCEL_TOKEN?.trim()) &&
      (process.env.CRON_SECRET?.length ?? 0) >= 16
    );
  } catch {
    return false;
  }
}
const canonical = (rows: Record<string, unknown>[]) =>
  JSON.stringify(
    rows.map((row) =>
      Object.entries(row).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

/** Public non-secret state, with no auth/session/API/collector or migration calls. */
export async function getAnalyticsRuntimeState(): Promise<AnalyticsRuntimeState> {
  const state: AnalyticsRuntimeState = {
    version: 1,
    commitSha: /^[a-f0-9]{40}$/.test(buildInfo.commit ?? "")
      ? buildInfo.commit!
      : "unknown",
    collectionEnabled: process.env.ANALYTICS_SYNC_ENABLED === "true",
    ...analyticsConnection(process.env.DATABASE_URL),
    configured: configured(),
    readinessChecked: false,
    schemaReady: false,
    ledgerReady: false,
  };
  // Disabled maintenance neither requires schema nor opens a database connection.
  if (
    isNextBuild() ||
    !state.collectionEnabled ||
    !state.configured ||
    state.connection !== "direct"
  )
    return state;
  let client: PoolClient | undefined;
  let destroy = false;
  try {
    client = await (getPool() as Pool).connect();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    state.readinessChecked = true;
    const identity = (
      await client.query(
        "SELECT current_database() AS database,current_user AS role,current_setting('transaction_read_only') AS read_only",
      )
    ).rows[0];
    if (
      identity?.database !== "tullyelly_db" ||
      identity?.role !== "tullyelly_admin" ||
      identity?.read_only !== "on"
    )
      return state;
    const columns = await client.query(
      "SELECT c.relname AS table_name,pg_get_userbyid(c.relowner) AS owner,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,COALESCE(pg_get_expr(d.adbin,d.adrelid),'') AS default_expr,a.attidentity AS identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='dojo' AND c.relname IN ('analytics_run','analytics_progress','analytics_day','analytics_page_day','analytics_stage') ORDER BY c.relname,a.attname",
    );
    const constraints = await client.query(
      "SELECT c.relname AS table_name,k.conname AS name,k.contype AS type,k.convalidated AS validated,pg_get_constraintdef(k.oid) AS definition FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_constraint k ON k.conrelid=c.oid WHERE n.nspname='dojo' AND c.relname IN ('analytics_run','analytics_progress','analytics_day','analytics_page_day','analytics_stage') ORDER BY c.relname,k.conname",
    );
    // Deparsing can omit dojo when it is already in this role's search_path.
    const normalized = constraints.rows.map((row) => ({
      ...row,
      definition: String(row.definition).replace(
        /REFERENCES (analytics_[a-z_]+)\(/g,
        "REFERENCES dojo.$1(",
      ),
    }));
    const feature = (
      await client.query(
        "SELECT EXISTS (SELECT 1 FROM dojo.authz_feature f JOIN dojo.authz_app a ON a.id=f.app_id JOIN dojo.authz_role_feature g ON g.feature_id=f.id JOIN dojo.authz_role r ON r.id=g.role_id WHERE f.key='admin.analytics.manage' AND f.enabled AND a.slug='admin' AND r.name='admin' AND g.effect='allow') AS ready",
      )
    ).rows[0];
    state.schemaReady =
      canonical(columns.rows) === canonical(expectedSchema.columns) &&
      canonical(normalized) === canonical(expectedSchema.constraints) &&
      feature?.ready === true;
    const presence = (
      await client.query(
        "SELECT to_regclass('dojo.schema_migration')::text AS ledger",
      )
    ).rows[0];
    if (!presence?.ledger) return state;
    const ledger = await client.query(
      "SELECT filename,checksum,checksum_algorithm,status,applied_at IS NOT NULL AS applied,error_message IS NOT NULL AS has_error FROM dojo.schema_migration WHERE filename=ANY($1::text[]) ORDER BY filename",
      [analyticsMigrations.map((m) => m.filename)],
    );
    state.ledgerReady =
      ledger.rows.length === 2 &&
      analyticsMigrations.every((m) =>
        ledger.rows.some(
          (row) =>
            row.filename === m.filename &&
            row.checksum === m.checksum &&
            row.checksum_algorithm === "sha256" &&
            row.status === "applied" &&
            row.applied === true &&
            row.has_error === false,
        ),
      );
    return state;
  } catch {
    return { ...state, schemaReady: false, ledgerReady: false };
  } finally {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        destroy = true;
      }
      client.release(destroy);
    }
  }
}
