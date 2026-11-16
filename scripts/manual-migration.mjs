// Offline preparation only. Never connects to PostgreSQL or loads environment files.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
export const hash = (text) => createHash("sha256").update(text).digest("hex");
// Inspect only outer SQL; quoted function bodies and strings are opaque.
function outerStatements(source) {
  const outer = source.replace(
    /--[^\n]*|\/\*[\s\S]*?\*\/|\$([a-z_][a-z0-9_]*|)\$[\s\S]*?\$\1\$|'(?:''|[^'])*'|"(?:""|[^"])*"/gi,
    " ",
  );
  return outer
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}
function hasTransaction(source) {
  return outerStatements(source).some((part) =>
    /^(?:BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK|ABORT|PREPARE\s+TRANSACTION)\b/i.test(
      part,
    ),
  );
}
export function migrationBody(source) {
  // New packages deliberately require this restricted transaction shape. Legacy
  // files and nontransactional operations need their own reviewed staged plan.
  const match = /^\s*(?:--[^\n]*\n)*BEGIN;\s*\n([\s\S]*?)\nCOMMIT;\s*$/i.exec(
    source,
  );
  if (
    !match ||
    hasTransaction(match[1]) ||
    /^\s*\\/m.test(source) ||
    /\b(?:CONCURRENTLY|VACUUM)\b/i.test(source)
  )
    throw new Error(
      "Expected one outer BEGIN/COMMIT, no nested transaction or psql commands; prepare an explicit exception plan.",
    );
  return match[1];
}
export function bundle({ filename, source, assertions }) {
  if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(filename))
    throw new Error("Canonical numbered migration filename required.");
  migrationBody(source);
  if (
    !assertions.trim() ||
    hasTransaction(assertions) ||
    /^\s*\\/m.test(assertions)
  )
    throw new Error("Transaction-free effect assertions required.");
  const checksum = hash(source),
    id = filename.slice(0, 3);
  const sql = `-- Generated offline. James runs this complete file ONLY after the canonical migration succeeds.
-- Canonical: db/migrations/${filename}; SHA-256: ${checksum}
-- This file verifies effects and records history; it never replays the migration.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger_guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '${id}%' AND filename<>'${filename}') THEN
    RAISE EXCEPTION '${id}: migration number occupied';
  END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='${filename}' AND
    (checksum IS DISTINCT FROM '${checksum}' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '${id}: conflicting or failed ledger history; stop for review';
  END IF;
END;
$ledger_guard$;
-- Required effect checks run before any history is recorded, including on reruns.
${assertions}
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
SELECT '${filename}','${checksum}','sha256','applied',now(),now(),NULL,NULL
WHERE NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='${filename}');
COMMIT;
`;
  return {
    sql,
    checksum,
    ledgerChecksum: hash(sql),
    assertionsChecksum: hash(assertions),
  };
}
export function prepare(
  canonicalPath,
  assertionsPath,
  outputPath,
  { check = false } = {},
) {
  if (
    !/^db\/migrations\/\d{3}_[a-z0-9_]+\.sql$/.test(canonicalPath) ||
    !outputPath.startsWith("db/operations/") ||
    outputPath.includes("..")
  )
    throw new Error(
      "Use canonical db/migrations input and db/operations output.",
    );
  const result = bundle({
    filename: basename(canonicalPath),
    source: readFileSync(canonicalPath, "utf8"),
    assertions: readFileSync(assertionsPath, "utf8"),
  });
  const manifest =
    JSON.stringify(
      {
        canonicalPath,
        canonicalSha256: result.checksum,
        assertionsPath,
        assertionsSha256: result.assertionsChecksum,
        ledgerPath: outputPath,
        ledgerSha256: result.ledgerChecksum,
        mode: "record-after-success",
      },
      null,
      2,
    ) + "\n";
  const manifestPath = join(
    dirname(outputPath),
    basename(outputPath, ".sql") + ".json",
  );
  if (check) {
    if (
      readFileSync(outputPath, "utf8") !== result.sql ||
      readFileSync(manifestPath, "utf8") !== manifest
    )
      throw new Error(
        "Stale checksum, ledger identity or ledger/check drift; regenerate and re-review.",
      );
  } else {
    writeFileSync(outputPath, result.sql);
    writeFileSync(manifestPath, manifest);
  }
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [command, canonical, assertions, output] = process.argv.slice(2);
    if (!["generate", "check"].includes(command) || !output)
      throw new Error(
        "Usage: manual-migration.mjs generate|check CANONICAL ASSERTIONS LEDGER",
      );
    const result = prepare(canonical, assertions, output, {
      check: command === "check",
    });
    console.log(
      `canonical sha256 ${result.checksum}\nledger sha256 ${result.ledgerChecksum}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
