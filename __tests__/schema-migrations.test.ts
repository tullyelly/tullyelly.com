import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildMigrationStatus,
  calculateMigrationChecksum,
  getBlockingDrift,
  getVerificationProblems,
  listMigrationFiles,
  resolveMigrationDatabaseUrl,
  type MigrationFile,
  type MigrationLedgerEntry,
} from "@/db/schema-migrations";

describe("schema migrations", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "schema-migrations-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("lists SQL migrations in filename order with checksums", async () => {
    await Promise.all([
      writeFile(path.join(tempDir, "010_later.sql"), "SELECT 10;\n"),
      writeFile(path.join(tempDir, "001_first.sql"), "SELECT 1;\n"),
      writeFile(path.join(tempDir, "002_second.sql"), "SELECT 2;\n"),
      writeFile(path.join(tempDir, "README.md"), "not a migration\n"),
    ]);

    const files = await listMigrationFiles(tempDir);

    expect(files.map((file) => file.filename)).toEqual([
      "001_first.sql",
      "002_second.sql",
      "010_later.sql",
    ]);
    expect(files[0]?.checksum).toBe(calculateMigrationChecksum("SELECT 1;\n"));
  });

  test("detects changed applied migrations and missing ledger files", () => {
    const current = migrationFile("001_first.sql", "SELECT 1;\n");
    const pending = migrationFile("002_second.sql", "SELECT 2;\n");
    const rows = buildMigrationStatus(
      [current, pending],
      [
        ledgerEntry({
          filename: current.filename,
          checksum: calculateMigrationChecksum("SELECT old;\n"),
          status: "applied",
        }),
        ledgerEntry({
          filename: "000_removed.sql",
          checksum: calculateMigrationChecksum("SELECT removed;\n"),
          status: "applied",
        }),
      ],
    );

    expect(rows.map((row) => [row.filename, row.state])).toEqual([
      ["001_first.sql", "checksum_mismatch"],
      ["002_second.sql", "pending"],
      ["000_removed.sql", "missing"],
    ]);
    expect(getBlockingDrift(rows).map((row) => row.filename)).toEqual([
      "001_first.sql",
      "000_removed.sql",
    ]);
  });

  test("treats pending, failed, missing, and checksum mismatches as verification problems", () => {
    const applied = migrationFile("001_applied.sql", "SELECT 1;\n");
    const failed = migrationFile("002_failed.sql", "SELECT 2;\n");
    const mismatch = migrationFile("003_mismatch.sql", "SELECT 3;\n");
    const pending = migrationFile("004_pending.sql", "SELECT 4;\n");

    const rows = buildMigrationStatus(
      [applied, failed, mismatch, pending],
      [
        ledgerEntry({
          filename: applied.filename,
          checksum: applied.checksum,
          status: "applied",
        }),
        ledgerEntry({
          filename: failed.filename,
          checksum: failed.checksum,
          status: "failed",
        }),
        ledgerEntry({
          filename: mismatch.filename,
          checksum: calculateMigrationChecksum("SELECT old;\n"),
          status: "applied",
        }),
        ledgerEntry({
          filename: "000_removed.sql",
          checksum: calculateMigrationChecksum("SELECT removed;\n"),
          status: "applied",
        }),
      ],
    );

    expect(getVerificationProblems(rows).map((row) => row.state)).toEqual([
      "failed",
      "checksum_mismatch",
      "pending",
      "missing",
    ]);
  });

  test("resolves safe migration database URLs", () => {
    expect(
      resolveMigrationDatabaseUrl({
        TEST_DATABASE_URL: "postgres://user:pass@localhost:5432/tullyelly_test",
        NODE_ENV: "test",
      }),
    ).toBe("postgres://user:pass@localhost:5432/tullyelly_test");

    expect(
      resolveMigrationDatabaseUrl({
        DATABASE_URL:
          "postgres://user:pass@localhost:5432/tullyelly_test?sslmode=require",
        NODE_ENV: "test",
      }),
    ).toContain("sslmode=verify-full");
  });

  test("refuses unsafe migration database URLs", () => {
    expect(() =>
      resolveMigrationDatabaseUrl({
        DATABASE_URL: "postgres://user:pass@main.example.com:5432/tullyelly",
        NODE_ENV: "development",
      }),
    ).toThrow("Refusing prod-looking DB in dev");

    expect(() =>
      resolveMigrationDatabaseUrl({
        DATABASE_URL: "postgres://neondb_owner@host/neondb",
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toThrow("Invalid DATABASE_URL");
  });
});

function migrationFile(filename: string, sql: string): MigrationFile {
  return {
    filename,
    sql,
    filePath: path.join("/tmp", filename),
    checksum: calculateMigrationChecksum(sql),
  };
}

function ledgerEntry(
  entry: Pick<MigrationLedgerEntry, "filename" | "checksum" | "status">,
): MigrationLedgerEntry {
  return {
    ...entry,
    checksumAlgorithm: "sha256",
    appliedAt: entry.status === "applied" ? new Date("2026-01-01") : null,
    attemptedAt: new Date("2026-01-01"),
    executionMs: 12,
    errorMessage: entry.status === "failed" ? "boom" : null,
  };
}
