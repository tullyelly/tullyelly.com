import { config } from "dotenv";

import type { MigrationStatusRow } from "../db/schema-migrations";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const {
  applyPendingMigrations,
  createMigrationPool,
  getBlockingDrift,
  getVerificationProblems,
  loadMigrationStatus,
  MigrationApplyError,
  MigrationStateError,
  MIGRATION_LEDGER_TABLE,
} = await import("../db/schema-migrations");

type Command = "status" | "apply" | "verify";

const command = parseCommand(process.argv[2]);

async function main() {
  const pool = createMigrationPool();

  try {
    if (command === "status") {
      const rows = await loadMigrationStatus(pool);
      printStatus(rows);
      const drift = getBlockingDrift(rows);
      if (drift.length > 0) {
        process.exitCode = 1;
      }
      return;
    }

    if (command === "verify") {
      const rows = await loadMigrationStatus(pool);
      printStatus(rows);
      const problems = getVerificationProblems(rows);
      if (problems.length > 0) {
        throw new MigrationStateError(
          `Migration verification failed; ${problems.length} problem(s) found.`,
          problems,
        );
      }
      console.log(
        "Migrations verified. All files are applied and checksums match.",
      );
      return;
    }

    const applied = await applyPendingMigrations(pool);
    if (applied.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    for (const migration of applied) {
      console.log(
        `Applied ${migration.filename} (${migration.executionMs} ms)`,
      );
    }
  } finally {
    await pool.end();
  }
}

function parseCommand(value: string | undefined): Command {
  if (value === "status" || value === "apply" || value === "verify") {
    return value;
  }

  console.error("Usage: tsx scripts/db-migrate.ts <status|apply|verify>");
  process.exit(1);
}

function printStatus(rows: MigrationStatusRow[]) {
  console.log(`Migration ledger: ${MIGRATION_LEDGER_TABLE}`);

  if (rows.length === 0) {
    console.log("No SQL migration files found.");
    return;
  }

  const filenameWidth = Math.max(
    "filename".length,
    ...rows.map((row) => row.filename.length),
  );
  const stateWidth = Math.max(
    "state".length,
    ...rows.map((row) => row.state.length),
  );
  const appliedWidth = Math.max(
    "applied_at".length,
    ...rows.map((row) => formatDate(row.appliedAt).length),
  );

  console.log(
    `${pad("state", stateWidth)}  ${pad("filename", filenameWidth)}  ${pad(
      "applied_at",
      appliedWidth,
    )}  checksum`,
  );

  for (const row of rows) {
    const checksum = formatChecksum(row);
    console.log(
      `${pad(row.state, stateWidth)}  ${pad(
        row.filename,
        filenameWidth,
      )}  ${pad(formatDate(row.appliedAt), appliedWidth)}  ${checksum}`,
    );
  }
}

function formatChecksum(row: MigrationStatusRow): string {
  if (row.state === "checksum_mismatch") {
    return `${shortChecksum(row.ledgerChecksum)} != ${shortChecksum(
      row.fileChecksum,
    )}`;
  }

  return shortChecksum(row.fileChecksum ?? row.ledgerChecksum);
}

function shortChecksum(value: string | null): string {
  return value ? value.slice(0, 12) : "-";
}

function formatDate(value: Date | string | null): string {
  if (!value) return "-";
  return value instanceof Date ? value.toISOString() : value;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

main().catch((error) => {
  if (error instanceof MigrationStateError) {
    console.error(error.message);
    for (const row of error.rows) {
      console.error(`- ${row.state}: ${row.filename}`);
    }
    process.exit(1);
  }

  if (error instanceof MigrationApplyError) {
    console.error(error.message);
    if (error.ledgerCause) {
      const message =
        error.ledgerCause instanceof Error
          ? error.ledgerCause.message
          : String(error.ledgerCause);
      console.error(`Failed to update migration ledger: ${message}`);
    }
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
