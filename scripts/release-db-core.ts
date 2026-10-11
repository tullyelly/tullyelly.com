import { createHash } from "node:crypto";
import { z } from "zod";
import expectedAnalyticsSchema from "./release-db-schema.json";
import type { QueryResult, QueryResultRow } from "pg";
import {
  listMigrationFiles,
  readMigrationLedger,
  resolveMigrationDatabaseUrl,
  type MigrationFile,
  type MigrationLedgerEntry,
} from "../db/schema-migrations";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const metadata = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9_./-]+$/);
export const releaseManifestSchema = z
  .object({
    version: z.literal(1),
    commit: z.string().regex(/^[a-f0-9]{40}$/),
    environment: z.enum(["production", "non-production"]),
    neon: z
      .object({
        projectId: metadata,
        branchId: metadata,
        host: metadata,
        database: metadata,
        role: metadata,
      })
      .strict(),
    vercel: z
      .object({
        teamId: metadata,
        projectId: metadata,
        productionDeploymentId: metadata,
        productionHost: metadata,
        settings: z
          .object({
            framework: z.literal("nextjs"),
            nodeVersion: z.literal("22.x"),
            buildCommand: z.string().nullable(),
            installCommand: z.string().nullable(),
            outputDirectory: z.null(),
            rootDirectory: z.null(),
          })
          .strict(),
        settingsSha256: sha,
      })
      .strict(),
    release: z
      .object({
        collectionEnabled: z.literal(false),
        automaticDeploymentsDisabled: z.literal(true),
        previewIsolationVerified: z.literal(true),
        backupVerifiedAt: z.string().datetime(),
        backupEvidenceUrl: z
          .string()
          .url()
          .refine((value) => value.startsWith("https://")),
      })
      .strict(),
    baselineLedgerSha256: sha,
    migrations: z
      .array(
        z
          .object({
            filename: z.string().regex(/^\d{3}_[a-z0-9_]+\.sql$/),
            sha256: sha,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type ReleaseManifest = z.infer<typeof releaseManifestSchema>;
export interface ReleaseClient {
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}
export function ledgerDigest(
  entries: MigrationLedgerEntry[],
  releaseNames: Set<string>,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        entries
          .filter((e) => !releaseNames.has(e.filename))
          .map((e) => ({
            filename: e.filename,
            checksum: e.checksum,
            checksumAlgorithm: e.checksumAlgorithm,
            status: e.status,
          }))
          .sort((a, b) => a.filename.localeCompare(b.filename)),
      ),
    )
    .digest("hex");
}
export function releaseTarget(
  manifest: ReleaseManifest,
  env: NodeJS.ProcessEnv,
): string {
  const raw = env.RELEASE_DATABASE_URL;
  if (!raw)
    throw new Error("Missing RELEASE_DATABASE_URL; no connection allowed.");
  if (
    manifest.environment === "production" &&
    (env.NODE_ENV !== "production" || env.VERCEL_ENV !== "production")
  )
    throw new Error(
      "Production release requires explicit production environment.",
    );
  if (
    manifest.environment === "non-production" &&
    (env.NODE_ENV === "production" || env.VERCEL_ENV === "production")
  )
    throw new Error("Non-production release refuses production environment.");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid release database URL; details omitted.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    url.hostname.includes("-pooler.") ||
    url.hostname !== manifest.neon.host ||
    (url.port && url.port !== "5432") ||
    decodeURIComponent(url.pathname.slice(1)) !== manifest.neon.database ||
    decodeURIComponent(url.username) !== manifest.neon.role ||
    url.hash ||
    [...url.searchParams.keys()].some(
      (k) => !["sslmode", "channel_binding"].includes(k),
    ) ||
    !["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode") ?? "",
    )
  )
    throw new Error(
      "Release URL does not match the approved direct TLS Neon target.",
    );
  return resolveMigrationDatabaseUrl({
    ...env,
    DATABASE_URL: raw,
    TEST_DATABASE_URL: undefined,
  });
}
// Strip only the reviewed outer transaction. Ignore transaction words in comments,
// quoted strings and PL/pgSQL dollar bodies; reject real transaction commands inside.
export function transactionalBody(sql: string): string {
  const tokens: { word: string; start: number; end: number }[] = [];
  const pattern =
    /--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|\$([A-Za-z_][A-Za-z0-9_]*|)\$[\s\S]*?\$\1\$|'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z0-9_]*|;/g;
  for (const match of sql.matchAll(pattern)) {
    const word = match[0];
    if (/^[A-Za-z_]/.test(word) || word === ";")
      tokens.push({
        word: word.toUpperCase(),
        start: match.index!,
        end: match.index! + word.length,
      });
  }
  if (
    tokens[0]?.word !== "BEGIN" ||
    tokens[1]?.word !== ";" ||
    tokens.at(-2)?.word !== "COMMIT" ||
    tokens.at(-1)?.word !== ";"
  )
    throw new Error(
      "Release migration must have one explicit outer BEGIN/COMMIT transaction.",
    );
  if (
    tokens
      .slice(2, -2)
      .some((t) =>
        ["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "ABORT", "END"].includes(
          t.word,
        ),
      )
  )
    throw new Error(
      "Unsupported inner transaction control; review migration separately.",
    );
  return sql.slice(tokens[1].end, tokens.at(-2)!.start);
}
export async function inspectRelease(
  db: ReleaseClient,
  manifest: ReleaseManifest,
  files: MigrationFile[],
) {
  const identity = await db.query<{ database: string; role: string }>(
    "SELECT current_database() AS database, current_user AS role",
  );
  if (
    identity.rows[0]?.database !== manifest.neon.database ||
    identity.rows[0]?.role !== manifest.neon.role
  )
    throw new Error(
      "Connected database identity differs from approved target.",
    );
  const exists = await db.query<{ ledger: string | null }>(
    "SELECT to_regclass('dojo.schema_migration')::text AS ledger",
  );
  if (!exists.rows[0]?.ledger)
    throw new Error(
      "Migration ledger absent; a separate reviewed reconciliation release is required.",
    );
  const entries = await readMigrationLedger(db);
  const names = manifest.migrations.map((m) => m.filename);
  if (
    new Set(names).size !== names.length ||
    [...names].sort((a, b) => a.localeCompare(b)).join() !== names.join()
  )
    throw new Error("Release migration names must be unique and ordered.");
  const selected = new Set(names);
  if (ledgerDigest(entries, selected) !== manifest.baselineLedgerSha256)
    throw new Error(
      "Baseline ledger drift; reconciliation or a revised release is required.",
    );
  const byName = new Map(files.map((f) => [f.filename, f]));
  const ledger = new Map(entries.map((e) => [e.filename, e]));
  for (const entry of entries) {
    if (
      !byName.has(entry.filename) ||
      entry.checksumAlgorithm !== "sha256" ||
      entry.status !== "applied" ||
      entry.checksum !== byName.get(entry.filename)!.checksum
    )
      throw new Error(`Ledger drift or failed migration: ${entry.filename}`);
  }
  const pending: MigrationFile[] = [];
  for (const file of files) {
    const approved = manifest.migrations.find(
      (m) => m.filename === file.filename,
    );
    if (approved && approved.sha256 !== file.checksum)
      throw new Error(`Approved checksum differs: ${file.filename}`);
    if (!ledger.has(file.filename)) {
      if (!approved)
        throw new Error(
          `Unrecorded historical migration requires reconciliation: ${file.filename}`,
        );
      transactionalBody(file.sql);
      pending.push(file);
    }
  }
  for (const name of names)
    if (!byName.has(name))
      throw new Error(`Approved migration missing: ${name}`);
  // Existing objects without ledger proof are ambiguous; never replay/baseline them.
  if (pending.some((f) => f.filename === "076_create_analytics_archive.sql")) {
    const result = await db.query<{ present: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='dojo' AND c.relname IN ('analytics_run','analytics_progress','analytics_day','analytics_page_day','analytics_stage')) AS present",
    );
    if (result.rows[0]?.present)
      throw new Error(
        "Analytics schema exists without ledger proof; reconciliation required.",
      );
  }
  if (pending.some((f) => f.filename === "077_analytics_operations.sql")) {
    const result = await db.query<{ present: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='dojo' AND ((table_name='analytics_run' AND column_name='lane') OR (table_name='analytics_progress' AND column_name='start_day'))) AS present",
    );
    if (result.rows[0]?.present)
      throw new Error(
        "Analytics operational schema exists without ledger proof; reconciliation required.",
      );
  }
  return pending;
}
export async function verifyAnalyticsSchema(db: ReleaseClient): Promise<void> {
  // Dedicated release connection only; fix deparser qualification independently
  // of role-specific search_path so FK targets compare consistently.
  await db.query("SET search_path = pg_catalog");
  const columns = await db.query(
    `SELECT c.relname AS table_name,pg_get_userbyid(c.relowner) AS owner,a.attname AS column_name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,COALESCE(pg_get_expr(d.adbin,d.adrelid),'') AS default_expr,a.attidentity AS identity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='dojo' AND c.relname IN ('analytics_run','analytics_progress','analytics_day','analytics_page_day','analytics_stage') ORDER BY c.relname,a.attname`,
  );
  const constraints = await db.query(
    `SELECT c.relname AS table_name,k.conname AS name,k.contype AS type,k.convalidated AS validated,pg_get_constraintdef(k.oid) AS definition FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_constraint k ON k.conrelid=c.oid WHERE n.nspname='dojo' AND c.relname IN ('analytics_run','analytics_progress','analytics_day','analytics_page_day','analytics_stage') ORDER BY c.relname,k.conname`,
  );
  // Canonical property sorting avoids depending on PostgreSQL object-key order.
  const canonical = (rows: unknown[]) =>
    JSON.stringify(
      rows.map((row) =>
        Object.entries(row as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
    );
  if (
    canonical(columns.rows) !== canonical(expectedAnalyticsSchema.columns) ||
    canonical(constraints.rows) !==
      canonical(expectedAnalyticsSchema.constraints)
  )
    throw new Error(
      "Analytics schema readiness failed: missing/changed columns, owners or validated constraints.",
    );
  const feature = await db.query<{ ready: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM dojo.authz_feature f JOIN dojo.authz_app a ON a.id=f.app_id JOIN dojo.authz_role_feature g ON g.feature_id=f.id JOIN dojo.authz_role r ON r.id=g.role_id WHERE f.key='admin.analytics.manage' AND f.enabled AND a.slug='admin' AND r.name='admin' AND g.effect='allow') AS ready`,
  );
  if (!feature.rows[0]?.ready)
    throw new Error("Analytics owner capability readiness failed.");
}

export async function executeRelease(
  db: ReleaseClient,
  manifest: ReleaseManifest,
  mode: "check" | "apply" | "verify",
  files?: MigrationFile[],
) {
  const lock = await db.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock(hashtextextended('cipher:schema-migrations', 0)) AS locked",
  );
  if (!lock.rows[0]?.locked)
    throw new Error(
      "Another migration execution holds the global release lock.",
    );
  const applied: string[] = [];
  try {
    const pending = await inspectRelease(
      db,
      manifest,
      files ?? (await listMigrationFiles()),
    );
    if (mode === "verify" && pending.length)
      throw new Error("Approved release migrations remain pending.");
    if (mode !== "apply") {
      if (
        !pending.length &&
        manifest.migrations.some(
          (m) => m.filename === "077_analytics_operations.sql",
        )
      )
        await verifyAnalyticsSchema(db);
      return { pending: pending.map((f) => f.filename), applied };
    }
    for (const file of pending) {
      const startedAt = Date.now();
      await db.query("BEGIN");
      try {
        await db.query(
          "SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s'",
        );
        await db.query(transactionalBody(file.sql));
        const result = await db.query(
          "INSERT INTO dojo.schema_migration (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message) VALUES ($1,$2,'sha256','applied',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,$3,NULL) RETURNING filename",
          [file.filename, file.checksum, Date.now() - startedAt],
        );
        if (result.rowCount !== 1)
          throw new Error("Atomic ledger insertion refused.");
        await db.query("COMMIT");
        applied.push(file.filename);
      } catch {
        await db.query("ROLLBACK");
        throw new Error(
          `Release migration failed or commit outcome uncertain: ${file.filename}; inspect ledger before rerun.`,
        );
      }
    }
    if (
      manifest.migrations.some(
        (m) => m.filename === "077_analytics_operations.sql",
      )
    )
      await verifyAnalyticsSchema(db);
    return { pending: [], applied };
  } finally {
    await db.query(
      "SELECT pg_advisory_unlock(hashtextextended('cipher:schema-migrations', 0))",
    );
  }
}
