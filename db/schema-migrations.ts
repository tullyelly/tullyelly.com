import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

import { assertValidDatabaseUrl } from "@/db/assert-database-url";
import { normalizeDatabaseUrl } from "@/lib/db-url";

export const DEFAULT_MIGRATIONS_DIR = path.join(
  process.cwd(),
  "db",
  "migrations",
);
export const MIGRATION_LEDGER_TABLE = "dojo.schema_migration";
export const CHECKSUM_ALGORITHM = "sha256";

export type LedgerStatus = "applied" | "failed";

export type MigrationState =
  | "applied"
  | "pending"
  | "failed"
  | "checksum_mismatch"
  | "missing";

export interface MigrationFile {
  filename: string;
  filePath: string;
  checksum: string;
  sql: string;
}

export interface MigrationLedgerEntry {
  filename: string;
  checksum: string;
  checksumAlgorithm: string;
  status: LedgerStatus;
  appliedAt: Date | string | null;
  attemptedAt: Date | string;
  executionMs: number | null;
  errorMessage: string | null;
}

export interface MigrationStatusRow {
  filename: string;
  state: MigrationState;
  fileChecksum: string | null;
  ledgerChecksum: string | null;
  ledgerStatus: LedgerStatus | null;
  appliedAt: Date | string | null;
  attemptedAt: Date | string | null;
  executionMs: number | null;
  errorMessage: string | null;
  file: MigrationFile | null;
}

export interface AppliedMigration {
  filename: string;
  executionMs: number;
}

interface MigrationClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

interface LedgerRow extends QueryResultRow {
  filename: string;
  checksum: string;
  checksum_algorithm: string;
  status: LedgerStatus;
  applied_at: Date | null;
  attempted_at: Date;
  execution_ms: number | null;
  error_message: string | null;
}

export class MigrationStateError extends Error {
  constructor(
    message: string,
    readonly rows: MigrationStatusRow[],
  ) {
    super(message);
    this.name = "MigrationStateError";
  }
}

export class MigrationApplyError extends Error {
  constructor(
    readonly filename: string,
    readonly cause: unknown,
    readonly ledgerCause?: unknown,
  ) {
    const message =
      cause instanceof Error ? cause.message : String(cause ?? "Unknown error");
    super(`Migration ${filename} failed: ${message}`);
    this.name = "MigrationApplyError";
  }
}

export function calculateMigrationChecksum(content: string | Buffer): string {
  return createHash(CHECKSUM_ALGORITHM).update(content).digest("hex");
}

export async function listMigrationFiles(
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
): Promise<MigrationFile[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(migrationsDir, filename);
      const sql = await readFile(filePath, "utf8");

      return {
        filename,
        filePath,
        checksum: calculateMigrationChecksum(sql),
        sql,
      };
    }),
  );
}

export function buildMigrationStatus(
  files: MigrationFile[],
  ledgerEntries: MigrationLedgerEntry[],
): MigrationStatusRow[] {
  const ledgerByFilename = new Map(
    ledgerEntries.map((entry) => [entry.filename, entry]),
  );
  const fileByFilename = new Map(files.map((file) => [file.filename, file]));

  const fileRows: MigrationStatusRow[] = files.map((file) => {
    const ledger = ledgerByFilename.get(file.filename);

    if (!ledger) {
      return {
        filename: file.filename,
        state: "pending",
        fileChecksum: file.checksum,
        ledgerChecksum: null,
        ledgerStatus: null,
        appliedAt: null,
        attemptedAt: null,
        executionMs: null,
        errorMessage: null,
        file,
      };
    }

    const state: MigrationState =
      ledger.status === "applied" && ledger.checksum !== file.checksum
        ? "checksum_mismatch"
        : ledger.status;

    return {
      filename: file.filename,
      state,
      fileChecksum: file.checksum,
      ledgerChecksum: ledger.checksum,
      ledgerStatus: ledger.status,
      appliedAt: ledger.appliedAt,
      attemptedAt: ledger.attemptedAt,
      executionMs: ledger.executionMs,
      errorMessage: ledger.errorMessage,
      file,
    };
  });

  const missingRows: MigrationStatusRow[] = ledgerEntries
    .filter((entry) => !fileByFilename.has(entry.filename))
    .map((entry) => ({
      filename: entry.filename,
      state: "missing" as const,
      fileChecksum: null,
      ledgerChecksum: entry.checksum,
      ledgerStatus: entry.status,
      appliedAt: entry.appliedAt,
      attemptedAt: entry.attemptedAt,
      executionMs: entry.executionMs,
      errorMessage: entry.errorMessage,
      file: null,
    }))
    .sort((left, right) => left.filename.localeCompare(right.filename));

  return [...fileRows, ...missingRows];
}

export function getBlockingDrift(
  rows: MigrationStatusRow[],
): MigrationStatusRow[] {
  return rows.filter(
    (row) => row.state === "checksum_mismatch" || row.state === "missing",
  );
}

export function getVerificationProblems(
  rows: MigrationStatusRow[],
): MigrationStatusRow[] {
  return rows.filter((row) => row.state !== "applied");
}

export function assertNoBlockingDrift(rows: MigrationStatusRow[]): void {
  const drift = getBlockingDrift(rows);
  if (drift.length === 0) return;

  const detail = drift.map((row) => `${row.state}: ${row.filename}`).join(", ");
  throw new MigrationStateError(
    `Migration ledger drift detected; refusing to continue. ${detail}`,
    drift,
  );
}

export function resolveMigrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.SKIP_DB === "true") {
    throw new Error("Database access disabled when SKIP_DB=true.");
  }

  if (env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Database access is disabled during Next.js production build.",
    );
  }

  const rawUrl = env.DATABASE_URL ?? env.TEST_DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      "Missing DATABASE_URL or TEST_DATABASE_URL. Set one in your env file.",
    );
  }

  assertValidDatabaseUrl(rawUrl, env);
  assertNonProductionDatabaseUrl(rawUrl, env);

  return normalizeDatabaseUrl(rawUrl);
}

export function createMigrationPool(
  env: NodeJS.ProcessEnv = process.env,
): Pool {
  return new Pool({
    connectionString: resolveMigrationDatabaseUrl(env),
    ssl: { rejectUnauthorized: false },
  });
}

export async function ensureMigrationLedger(
  db: MigrationClient,
): Promise<void> {
  await db.query(`
CREATE SCHEMA IF NOT EXISTS dojo;

CREATE TABLE IF NOT EXISTS dojo.schema_migration (
  filename TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT NOT NULL DEFAULT 'sha256',
  status TEXT NOT NULL CHECK (status IN ('applied', 'failed')),
  applied_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_ms INTEGER,
  error_message TEXT,
  CONSTRAINT schema_migration_applied_at_check
    CHECK (status = 'failed' OR applied_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS schema_migration_status_idx
  ON dojo.schema_migration (status);
`);
}

export async function readMigrationLedger(
  db: MigrationClient,
): Promise<MigrationLedgerEntry[]> {
  const result = await db.query<LedgerRow>(`
SELECT filename,
       checksum,
       checksum_algorithm,
       status,
       applied_at,
       attempted_at,
       execution_ms,
       error_message
  FROM dojo.schema_migration
 ORDER BY filename ASC;
`);

  return result.rows.map((row) => ({
    filename: row.filename,
    checksum: row.checksum,
    checksumAlgorithm: row.checksum_algorithm,
    status: row.status,
    appliedAt: row.applied_at,
    attemptedAt: row.attempted_at,
    executionMs: row.execution_ms,
    errorMessage: row.error_message,
  }));
}

export async function loadMigrationStatus(
  db: MigrationClient,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
): Promise<MigrationStatusRow[]> {
  await ensureMigrationLedger(db);

  const [files, ledgerEntries] = await Promise.all([
    listMigrationFiles(migrationsDir),
    readMigrationLedger(db),
  ]);

  return buildMigrationStatus(files, ledgerEntries);
}

export async function applyPendingMigrations(
  db: MigrationClient,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
): Promise<AppliedMigration[]> {
  const rows = await loadMigrationStatus(db, migrationsDir);
  assertNoBlockingDrift(rows);

  const pendingRows = rows.filter(
    (row) => (row.state === "pending" || row.state === "failed") && row.file,
  );
  const applied: AppliedMigration[] = [];

  for (const row of pendingRows) {
    if (!row.file) continue;
    applied.push(await applyMigrationFile(db, row.file));
  }

  return applied;
}

async function applyMigrationFile(
  db: MigrationClient,
  file: MigrationFile,
): Promise<AppliedMigration> {
  const startedAt = Date.now();

  try {
    await db.query(file.sql);
  } catch (cause) {
    const executionMs = Date.now() - startedAt;
    const errorMessage = cause instanceof Error ? cause.message : String(cause);
    let ledgerCause: unknown;

    try {
      await rollbackOpenTransaction(db);
      await recordFailedMigration(db, file, executionMs, errorMessage);
    } catch (error) {
      ledgerCause = error;
    }

    throw new MigrationApplyError(file.filename, cause, ledgerCause);
  }

  const executionMs = Date.now() - startedAt;

  try {
    await recordAppliedMigration(db, file, executionMs);
  } catch (ledgerCause) {
    throw new MigrationApplyError(
      file.filename,
      new Error("SQL applied, but the migration ledger update failed."),
      ledgerCause,
    );
  }

  return { filename: file.filename, executionMs };
}

async function recordAppliedMigration(
  db: MigrationClient,
  file: MigrationFile,
  executionMs: number,
): Promise<void> {
  const result = await db.query(
    `
INSERT INTO dojo.schema_migration (
  filename,
  checksum,
  checksum_algorithm,
  status,
  applied_at,
  attempted_at,
  execution_ms,
  error_message
) VALUES ($1, $2, $3, 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4, NULL)
ON CONFLICT (filename) DO UPDATE
  SET checksum = EXCLUDED.checksum,
      checksum_algorithm = EXCLUDED.checksum_algorithm,
      status = 'applied',
      applied_at = EXCLUDED.applied_at,
      attempted_at = EXCLUDED.attempted_at,
      execution_ms = EXCLUDED.execution_ms,
      error_message = NULL
WHERE dojo.schema_migration.status = 'failed'
RETURNING filename;
`,
    [file.filename, file.checksum, CHECKSUM_ALGORITHM, executionMs],
  );

  if (result.rowCount !== 1) {
    throw new Error(`Ledger update refused for ${file.filename}.`);
  }
}

async function recordFailedMigration(
  db: MigrationClient,
  file: MigrationFile,
  executionMs: number,
  errorMessage: string,
): Promise<void> {
  const result = await db.query(
    `
INSERT INTO dojo.schema_migration (
  filename,
  checksum,
  checksum_algorithm,
  status,
  applied_at,
  attempted_at,
  execution_ms,
  error_message
) VALUES ($1, $2, $3, 'failed', NULL, CURRENT_TIMESTAMP, $4, $5)
ON CONFLICT (filename) DO UPDATE
  SET checksum = EXCLUDED.checksum,
      checksum_algorithm = EXCLUDED.checksum_algorithm,
      status = 'failed',
      applied_at = NULL,
      attempted_at = EXCLUDED.attempted_at,
      execution_ms = EXCLUDED.execution_ms,
      error_message = EXCLUDED.error_message
WHERE dojo.schema_migration.status <> 'applied'
RETURNING filename;
`,
    [
      file.filename,
      file.checksum,
      CHECKSUM_ALGORITHM,
      executionMs,
      errorMessage,
    ],
  );

  if (result.rowCount !== 1) {
    throw new Error(`Ledger failure update refused for ${file.filename}.`);
  }
}

async function rollbackOpenTransaction(db: MigrationClient): Promise<void> {
  try {
    await db.query("ROLLBACK;");
  } catch {
    // Best effort cleanup after SQL failure. Recording the failure is still attempted.
  }
}

function assertNonProductionDatabaseUrl(
  url: string,
  env: NodeJS.ProcessEnv,
): void {
  if (env.NODE_ENV === "production") return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid DATABASE_URL: ${message}`);
  }

  const host = parsed.host.toLowerCase();
  const db = parsed.pathname.slice(1).toLowerCase();
  const prodish =
    host.includes("prod") || host.includes("main") || db.includes("prod");

  if (prodish) {
    throw new Error(`Refusing prod-looking DB in dev: host=${host} db=${db}`);
  }
}
