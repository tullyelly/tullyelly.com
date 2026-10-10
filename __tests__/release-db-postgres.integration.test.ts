/** @jest-environment node */
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { analyticsTestTarget } from "@/db/analytics-test-target";
import {
  calculateMigrationChecksum,
  type MigrationFile,
  type MigrationLedgerEntry,
} from "@/db/schema-migrations";
import {
  executeRelease,
  ledgerDigest,
  type ReleaseClient,
  type ReleaseManifest,
} from "@/scripts/release-db-core";

const integration =
  process.env.ANALYTICS_INTEGRATION_CONFIRMED === "true"
    ? describe
    : describe.skip;
integration(
  "release executor real PostgreSQL rehearsal using a disposable fixture ledger",
  () => {
    const schema = `analytics_release_fixture_${randomBytes(6).toString("hex")}`;
    let db: Client;
    let adapter: ReleaseClient;
    let manifest: ReleaseManifest;
    const file = (filename: string, sql: string): MigrationFile => ({
      filename,
      sql,
      filePath: filename,
      checksum: calculateMigrationChecksum(sql),
    });
    const old = file("001_fixture.sql", "BEGIN; SELECT 1; COMMIT;");
    const first = file(
      "078_fixture_create.sql",
      "BEGIN; CREATE TABLE dojo.fixture_count (id integer PRIMARY KEY); COMMIT;",
    );
    const second = file(
      "079_fixture_extend.sql",
      "BEGIN; ALTER TABLE dojo.fixture_count ADD COLUMN total integer; COMMIT;",
    );
    beforeAll(async () => {
      const target = analyticsTestTarget();
      db = new Client({
        connectionString: target.connectionString,
        connectionTimeoutMillis: 5000,
      });
      await db.connect();
      const identity = await db.query(
        "SELECT current_database() AS database,current_user AS role",
      );
      expect(identity.rows[0]).toEqual({
        database: target.metadata.database,
        role: target.metadata.role,
      });
      await db.query(
        `CREATE SCHEMA ${schema}; CREATE TABLE ${schema}.schema_migration (filename text PRIMARY KEY,checksum text NOT NULL,checksum_algorithm text NOT NULL,status text NOT NULL,applied_at timestamptz,attempted_at timestamptz NOT NULL,execution_ms integer,error_message text)`,
      );
      await db.query(
        `INSERT INTO ${schema}.schema_migration VALUES ($1,$2,'sha256','applied',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,NULL)`,
        [old.filename, old.checksum],
      );
      adapter = {
        query: (sql, values) =>
          db.query(sql.replace(/\bdojo\b/g, schema), values),
      };
      const baseline: MigrationLedgerEntry = {
        filename: old.filename,
        checksum: old.checksum,
        checksumAlgorithm: "sha256",
        status: "applied",
        appliedAt: new Date(),
        attemptedAt: new Date(),
        executionMs: 0,
        errorMessage: null,
      };
      manifest = {
        version: 1,
        commit: "a".repeat(40),
        environment: "non-production",
        neon: {
          projectId: target.metadata.project,
          branchId: target.metadata.branch,
          host: target.metadata.host,
          database: target.metadata.database,
          role: target.metadata.role,
        },
        baselineLedgerSha256: ledgerDigest([baseline], new Set()),
        migrations: [first, second].map((f) => ({
          filename: f.filename,
          sha256: f.checksum,
        })),
        vercel: {
          teamId: "fixture",
          projectId: "fixture",
          productionDeploymentId: "fixture",
          productionHost: "fixture",
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
          backupEvidenceUrl: "https://example.com/fixture",
        },
      };
    }, 30000);
    afterAll(async () => {
      if (db) {
        try {
          await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        } finally {
          await db.end();
        }
      }
    }, 30000);
    test("atomic migration completion, exact rerun and verification use real transactions", async () => {
      const result = await executeRelease(adapter, manifest, "apply", [
        old,
        first,
        second,
      ]);
      expect(result.applied).toEqual([first.filename, second.filename]);
      expect(
        (await executeRelease(adapter, manifest, "apply", [old, first, second]))
          .applied,
      ).toEqual([]);
      expect(
        (
          await executeRelease(adapter, manifest, "verify", [
            old,
            first,
            second,
          ])
        ).pending,
      ).toEqual([]);
      const columns = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='fixture_count' ORDER BY column_name",
        [schema],
      );
      expect(columns.rows).toEqual([
        { column_name: "id" },
        { column_name: "total" },
      ]);
    }, 30000);
    test("a second connection holding the migration lock prevents execution", async () => {
      const other = new Client({
        connectionString: analyticsTestTarget().connectionString,
        connectionTimeoutMillis: 5000,
      });
      await other.connect();
      try {
        await other.query(
          "SELECT pg_advisory_lock(hashtextextended('cipher:schema-migrations',0))",
        );
        await expect(
          executeRelease(adapter, manifest, "apply", [old, first, second]),
        ).rejects.toThrow("global release lock");
      } finally {
        await other.end();
      }
    }, 30000);
    test("ledger insertion failure rolls back fixture schema; subsequent approved rerun succeeds", async () => {
      const bad = file(
        "080_fixture_failure.sql",
        "BEGIN; CREATE TABLE dojo.rollback_probe (id integer); INSERT INTO dojo.schema_migration (filename,checksum,checksum_algorithm,status,applied_at,attempted_at) VALUES ('080_fixture_failure.sql','fixture','sha256','applied',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP); COMMIT;",
      );
      const baselineEntries = await db.query(
        `SELECT filename,checksum FROM ${schema}.schema_migration ORDER BY filename`,
      );
      const baseline = baselineEntries.rows.map((row) => ({
        filename: row.filename,
        checksum: row.checksum,
        checksumAlgorithm: "sha256",
        status: "applied" as const,
        appliedAt: new Date(),
        attemptedAt: new Date(),
        executionMs: 0,
        errorMessage: null,
      }));
      const changed = {
        ...manifest,
        baselineLedgerSha256: ledgerDigest(baseline, new Set()),
        migrations: [{ filename: bad.filename, sha256: bad.checksum }],
      };
      await expect(
        executeRelease(adapter, changed, "apply", [old, first, second, bad]),
      ).rejects.toThrow("commit outcome uncertain");
      expect(
        (
          await db.query("SELECT to_regclass($1) AS relation", [
            `${schema}.rollback_probe`,
          ])
        ).rows[0].relation,
      ).toBeNull();
      expect(
        (
          await db.query(
            `SELECT filename FROM ${schema}.schema_migration WHERE filename=$1`,
            [bad.filename],
          )
        ).rows,
      ).toEqual([]);
      const good = file(
        bad.filename,
        "BEGIN; CREATE TABLE dojo.rollback_probe (id integer); COMMIT;",
      );
      changed.migrations = [{ filename: good.filename, sha256: good.checksum }];
      expect(
        (
          await executeRelease(adapter, changed, "apply", [
            old,
            first,
            second,
            good,
          ])
        ).applied,
      ).toEqual([good.filename]);
    }, 30000);
  },
);
