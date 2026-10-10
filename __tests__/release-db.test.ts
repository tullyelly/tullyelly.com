/** @jest-environment node */
import {
  calculateMigrationChecksum,
  type MigrationFile,
  type MigrationLedgerEntry,
} from "@/db/schema-migrations";
import expectedSchema from "@/scripts/release-db-schema.json";
import {
  verifyAnalyticsSchema,
  executeRelease,
  inspectRelease,
  ledgerDigest,
  releaseManifestSchema,
  releaseTarget,
  transactionalBody,
  type ReleaseClient,
  type ReleaseManifest,
} from "@/scripts/release-db-core";

const file = (
  filename: string,
  sql = "BEGIN; SELECT 1; COMMIT;",
): MigrationFile => ({
  filename,
  sql,
  checksum: calculateMigrationChecksum(sql),
  filePath: filename,
});
const old = file("001_old.sql");
const first = file("076_create_analytics_archive.sql");
const second = file("077_analytics_operations.sql");
const entry = (f: MigrationFile): MigrationLedgerEntry => ({
  filename: f.filename,
  checksum: f.checksum,
  checksumAlgorithm: "sha256",
  status: "applied",
  appliedAt: "2020-01-01",
  attemptedAt: "2020-01-01",
  executionMs: 0,
  errorMessage: null,
});
const manifest = (): ReleaseManifest => ({
  version: 1,
  commit: "a".repeat(40),
  environment: "non-production",
  neon: {
    projectId: "project-test",
    branchId: "br-test",
    host: "ep-test.us-east-2.aws.neon.tech",
    database: "tullyelly_db",
    role: "tullyelly_admin",
  },
  baselineLedgerSha256: ledgerDigest([entry(old)], new Set()),
  migrations: [first, second].map((f) => ({
    filename: f.filename,
    sha256: f.checksum,
  })),
  vercel: {
    teamId: "team-test",
    projectId: "prj-test",
    productionDeploymentId: "dpl-test",
    productionHost: "tullyelly.com",
    settings: {
      framework: "nextjs",
      nodeVersion: "22.x",
      buildCommand: null,
      installCommand: null,
      outputDirectory: null,
      rootDirectory: null,
    },
    settingsSha256: "a".repeat(64),
  },
  release: {
    collectionEnabled: false,
    automaticDeploymentsDisabled: true,
    previewIsolationVerified: true,
    backupVerifiedAt: "2026-10-10T00:00:00Z",
    backupEvidenceUrl: "https://example.com/recovery",
  },
});
const env = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  VERCEL_ENV: "development",
  RELEASE_DATABASE_URL:
    "postgresql://tullyelly_admin@ep-test.us-east-2.aws.neon.tech/tullyelly_db?sslmode=require",
});
function client(
  entries = [entry(old)],
  options: {
    locked?: boolean;
    ledger?: boolean;
    present?: boolean;
    failLedger?: boolean;
    failSql?: boolean;
  } = {},
) {
  const calls: string[] = [];
  const query = jest.fn(async (sql: string, values?: unknown[]) => {
    calls.push(sql);
    if (sql.includes("AS column_name"))
      return {
        rows: expectedSchema.columns,
        rowCount: expectedSchema.columns.length,
      };
    if (sql.includes("k.conname AS name"))
      return {
        rows: expectedSchema.constraints,
        rowCount: expectedSchema.constraints.length,
      };
    if (sql.includes(" AS ready"))
      return { rows: [{ ready: true }], rowCount: 1 };
    if (sql.includes("pg_try_advisory_lock"))
      return { rows: [{ locked: options.locked ?? true }], rowCount: 1 };
    if (sql.includes("current_database()"))
      return {
        rows: [{ database: "tullyelly_db", role: "tullyelly_admin" }],
        rowCount: 1,
      };
    if (sql.includes("to_regclass"))
      return {
        rows: [
          { ledger: options.ledger === false ? null : "dojo.schema_migration" },
        ],
        rowCount: 1,
      };
    if (sql.includes("SELECT filename"))
      return {
        rows: entries.map((e) => ({
          filename: e.filename,
          checksum: e.checksum,
          checksum_algorithm: e.checksumAlgorithm,
          status: e.status,
          applied_at: e.appliedAt,
          attempted_at: e.attemptedAt,
          execution_ms: e.executionMs,
          error_message: e.errorMessage,
        })),
        rowCount: entries.length,
      };
    if (sql.includes(" AS present"))
      return { rows: [{ present: options.present ?? false }], rowCount: 1 };
    if (sql.includes("INSERT INTO dojo.schema_migration")) {
      if (options.failLedger) throw new Error("fixture ledger failure");
      const f = [first, second].find((item) => item.filename === values?.[0]);
      if (f) entries.push(entry(f));
      return { rows: [{ filename: values?.[0] }], rowCount: 1 };
    }
    if (options.failSql && sql.includes("SELECT 1"))
      throw new Error("fixture SQL failure");
    return { rows: [], rowCount: 0 };
  });
  return { db: { query } as unknown as ReleaseClient, calls, query, entries };
}

describe("release database safety", () => {
  test("validates strict known manifest fields", () => {
    expect(releaseManifestSchema.parse(manifest())).toEqual(manifest());
    expect(() =>
      releaseManifestSchema.parse({ ...manifest(), allowAnything: true }),
    ).toThrow();
  });
  test("requires direct TLS target and preserves build/SKIP_DB guards", () => {
    expect(releaseTarget(manifest(), env())).toContain("ep-test");
    for (const patch of [
      { SKIP_DB: "true" },
      { NEXT_PHASE: "phase-production-build" },
      {
        RELEASE_DATABASE_URL: env().RELEASE_DATABASE_URL!.replace(
          "ep-test.",
          "ep-test-pooler.",
        ),
      },
      {
        RELEASE_DATABASE_URL: env().RELEASE_DATABASE_URL!.replace(
          "ep-test.",
          "ep-other.",
        ),
      },
      {
        RELEASE_DATABASE_URL: env().RELEASE_DATABASE_URL!.replace(
          "require",
          "disable",
        ),
      },
    ])
      expect(() => releaseTarget(manifest(), { ...env(), ...patch })).toThrow();
  });
  test("refuses environment mismatch and malformed URLs without echoing them", () => {
    expect(() =>
      releaseTarget(manifest(), { ...env(), NODE_ENV: "production" }),
    ).toThrow();
    expect(() =>
      releaseTarget(manifest(), {
        ...env(),
        RELEASE_DATABASE_URL: "secret-invalid",
      }),
    ).toThrow("details omitted");
  });
  test("rejects ambiguous transaction control while retaining DO bodies", () => {
    expect(
      transactionalBody(
        "-- comment\nBEGIN; DO $$ BEGIN PERFORM 1; END $$; COMMIT;",
      ),
    ).toContain("DO $$");
    for (const sql of [
      "SELECT 1;",
      "BEGIN; COMMIT; SELECT 1; COMMIT;",
      "BEGIN; ROLLBACK; COMMIT;",
      "BEGIN; SAVEPOINT a; COMMIT;",
    ])
      expect(() => transactionalBody(sql)).toThrow();
  });
  test("baseline digest excludes only approved release entries and detects historic drift", () => {
    expect(
      ledgerDigest([entry(first), entry(old)], new Set([first.filename])),
    ).toBe(manifest().baselineLedgerSha256);
    expect(
      ledgerDigest([{ ...entry(old), status: "failed" }], new Set()),
    ).not.toBe(manifest().baselineLedgerSha256);
  });
  test("check performs no DDL/ledger initialization", async () => {
    const c = client();
    expect(
      await executeRelease(c.db, manifest(), "check", [old, first, second]),
    ).toEqual({ pending: [first.filename, second.filename], applied: [] });
    expect(c.calls.some((sql) => /CREATE|INSERT|^BEGIN/.test(sql))).toBe(false);
  });
  test("missing ledger requires separate reconciliation", async () => {
    const c = client([], { ledger: false });
    await expect(
      executeRelease(c.db, manifest(), "apply", [old, first, second]),
    ).rejects.toThrow("separate reviewed reconciliation");
    expect(c.calls.some((sql) => sql.startsWith("BEGIN"))).toBe(false);
  });
  test("historical unrecorded files are not silently replayed", async () => {
    const m = manifest();
    m.baselineLedgerSha256 = ledgerDigest([], new Set());
    await expect(
      inspectRelease(client([]).db, m, [old, first, second]),
    ).rejects.toThrow("Unrecorded historical");
  });
  test("checksum, algorithm and failed ledger drift stop before writes", async () => {
    for (const changed of [
      { ...entry(old), checksum: "b".repeat(64) },
      { ...entry(old), checksumAlgorithm: "md5" },
      { ...entry(old), status: "failed" as const },
    ]) {
      const m = manifest();
      m.baselineLedgerSha256 = ledgerDigest([changed], new Set());
      await expect(
        inspectRelease(client([changed]).db, m, [old, first, second]),
      ).rejects.toThrow("Ledger drift");
    }
  });
  test("approved bytes and exact ordered filenames are enforced", async () => {
    const m = manifest();
    m.migrations[0].sha256 = "b".repeat(64);
    await expect(
      inspectRelease(client().db, m, [old, first, second]),
    ).rejects.toThrow("checksum");
    m.migrations.reverse();
    await expect(
      inspectRelease(client().db, m, [old, first, second]),
    ).rejects.toThrow("unique and ordered");
  });
  test("existing analytics objects without ledger proof are ambiguous", async () => {
    await expect(
      inspectRelease(client(undefined, { present: true }).db, manifest(), [
        old,
        first,
        second,
      ]),
    ).rejects.toThrow("schema exists without ledger proof");
  });
  test("global overlap lock refuses concurrent operation", async () => {
    const c = client(undefined, { locked: false });
    await expect(
      executeRelease(c.db, manifest(), "apply", [old, first, second]),
    ).rejects.toThrow("global release lock");
    expect(c.calls).toHaveLength(1);
  });
  test("schema and ledger commit atomically and applied rerun is a no-op", async () => {
    const c = client();
    expect(
      (await executeRelease(c.db, manifest(), "apply", [old, first, second]))
        .applied,
    ).toEqual([first.filename, second.filename]);
    const insert = c.calls.findIndex((s) => s.includes("INSERT INTO"));
    expect(c.calls.slice(0, insert).includes("BEGIN")).toBe(true);
    expect(c.calls[insert + 1]).toBe("COMMIT");
    expect(
      (await executeRelease(c.db, manifest(), "apply", [old, first, second]))
        .applied,
    ).toEqual([]);
  });
  test("atomic ledger failure rolls back schema and never reaches later file", async () => {
    const c = client(undefined, { failLedger: true });
    await expect(
      executeRelease(c.db, manifest(), "apply", [old, first, second]),
    ).rejects.toThrow(first.filename);
    expect(c.calls).toContain("ROLLBACK");
    expect(c.calls.filter((s) => s === "BEGIN")).toHaveLength(1);
    expect(c.calls.some((s) => s.includes("pg_advisory_unlock"))).toBe(true);
  });
  test("SQL failure rolls back without an applied ledger marker", async () => {
    const c = client(undefined, { failSql: true });
    await expect(
      executeRelease(c.db, manifest(), "apply", [old, first, second]),
    ).rejects.toThrow("outcome uncertain");
    expect(c.calls).toContain("ROLLBACK");
    expect(c.calls.some((s) => s.includes("INSERT INTO"))).toBe(false);
  });
  test("partial prior completion resumes only remaining approved migration", async () => {
    const c = client([entry(old), entry(first)]);
    expect(
      (await executeRelease(c.db, manifest(), "apply", [old, first, second]))
        .applied,
    ).toEqual([second.filename]);
  });
  test("verify refuses remaining approved pending migrations", async () => {
    await expect(
      executeRelease(client().db, manifest(), "verify", [old, first, second]),
    ).rejects.toThrow("remain pending");
  });
});

test("readiness refuses missing columns and altered constraint definitions", async () => {
  for (const bad of ["column", "constraint", "feature"]) {
    const db = {
      query: jest.fn(async (sql: string) => ({
        rows: sql.includes("AS column_name")
          ? bad === "column"
            ? []
            : expectedSchema.columns
          : sql.includes("k.conname AS name")
            ? bad === "constraint"
              ? expectedSchema.constraints.map((row, index) =>
                  index === 0 ? { ...row, definition: "CHECK (true)" } : row,
                )
              : expectedSchema.constraints
            : [{ ready: bad !== "feature" }],
      })),
    } as unknown as ReleaseClient;
    await expect(verifyAnalyticsSchema(db)).rejects.toThrow("readiness failed");
  }
});
