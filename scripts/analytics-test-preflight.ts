import { readFile, mkdir, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { analyticsTestTarget } from "@/db/analytics-test-target";
import {
  buildMigrationStatus,
  listMigrationFiles,
  readMigrationLedger,
} from "@/db/schema-migrations";

async function main() {
  const target = analyticsTestTarget();
  console.log("Confirmed local metadata:", target.metadata);
  if (process.argv[2] !== "inspect") {
    console.log(
      "No database connection made. Use inspect for read-only test-branch assessment.",
    );
    return;
  }
  const client = new Client({
    connectionString: target.connectionString,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
    options: "-c default_transaction_read_only=on",
  });
  try {
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const catalog: Record<string, Record<string, unknown>[]> = {};
    const source = await readFile(
      "db/diagnostics/analytics-schema.sql",
      "utf8",
    );
    for (const section of source.split(/^-- query: /m).slice(1)) {
      const newline = section.indexOf("\n");
      const name = section.slice(0, newline).trim();
      if (name === "begin" || name === "rollback") continue;
      catalog[name] = (await client.query(section.slice(newline + 1))).rows;
    }
    const identity = catalog.target[0];
    if (
      identity.database !== target.metadata.database ||
      identity.role !== target.metadata.role ||
      identity.read_only !== "on"
    )
      throw new Error("Database identity/read-only verification failed.");
    const files = await listMigrationFiles();
    const ledgerPresent = Boolean(catalog.ledger_presence[0]?.ledger);
    const ledger = ledgerPresent ? await readMigrationLedger(client) : [];
    const states = buildMigrationStatus(files, ledger).map(
      ({ filename, state, fileChecksum, ledgerChecksum }) => ({
        filename,
        fileChecksum,
        ledgerChecksum,
        ledgerState: !ledgerPresent
          ? "ledger_absent"
          : ledger.find((row) => row.filename === filename)
                ?.checksumAlgorithm !== "sha256" &&
              ledger.some((row) => row.filename === filename)
            ? "algorithm_mismatch"
            : state,
        schemaAssessment: "needs_per_migration_review",
      }),
    );
    await client.query("ROLLBACK");
    await mkdir("cipher", { recursive: true });
    const output = "cipher/analytics-test-preflight.json";
    await writeFile(
      output,
      JSON.stringify(
        {
          inspectedAt: new Date().toISOString(),
          target: target.metadata,
          ledgerPresent,
          migrations: states,
          catalog,
        },
        null,
        2,
      ) + "\n",
      { mode: 0o600 },
    );
    console.log(
      `Read-only assessment saved to ${output}; no migrations or ledger writes performed.`,
    );
    console.log(
      "Unrecorded files require schema/data-effect review; pending ledger state does not prove absent schema.",
    );
  } finally {
    await client.end();
  }
}
main().catch(() => {
  // Never print driver error messages or connection URL/credentials.
  console.error(
    "Analytics test preflight failed. Check confirmed metadata, TLS, test connectivity and catalog permissions; credentials and driver details omitted.",
  );
  process.exitCode = 1;
});
