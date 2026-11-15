// Offline preparation only. Never connects to PostgreSQL or loads environment files.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
export const hash = (text) => createHash("sha256").update(text).digest("hex");
function quote(text, tag) {
  const delimiter = `$${tag}$`;
  if (text.includes(delimiter))
    throw new Error(`Reserved SQL delimiter ${delimiter}`);
  return `${delimiter}${text}${delimiter}`;
}
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
export function bundle({ filename, source, assertions, executionReference }) {
  if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(filename))
    throw new Error("Canonical numbered migration filename required.");
  if (
    !assertions.trim() ||
    hasTransaction(assertions) ||
    /^\s*\\/m.test(assertions)
  )
    throw new Error("Standalone transaction-free effect assertions required.");
  const body = migrationBody(source);
  const checksum = hash(source);
  const id = filename.slice(0, 3);
  const reconcile = executionReference !== undefined;
  if (reconcile && !executionReference.trim())
    throw new Error(
      "Reconciliation requires confirmed exact-file execution evidence and successful postflight.",
    );
  const sql = `-- Generated offline; James runs this complete script in the reviewed DataGrip target.
-- Canonical: db/migrations/${filename}; SHA-256: ${checksum}
-- ${reconcile ? "CONDITIONAL RECONCILIATION ONLY. Exact execution evidence: " + executionReference.replace(/[\r\n]/g, " ") : "NORMAL APPLY PATH. Do not also execute the canonical migration."}
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations', 0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $manual_bundle$
BEGIN
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '${id}%' AND filename <> '${filename}') THEN
    RAISE EXCEPTION '${id}: migration number occupied';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '${filename}' AND
    (checksum IS DISTINCT FROM '${checksum}' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '${id}: conflicting or failed ledger history; stop for review';
  END IF;
${
  reconcile
    ? ""
    : `  IF NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '${filename}') THEN
    EXECUTE ${quote(body, "canonical_body")};
  END IF;`
}
  -- Required effects must pass even on matching-history reruns.
  EXECUTE ${quote(assertions, "effect_assertions")};
  INSERT INTO dojo.schema_migration
    (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
  SELECT '${filename}', '${checksum}', 'sha256', 'applied', now(), now(), NULL, NULL
  WHERE NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '${filename}');
END;
$manual_bundle$;
COMMIT;
`;
  return {
    sql,
    checksum,
    wrapperChecksum: hash(sql),
    assertionsChecksum: hash(assertions),
  };
}
export function prepare(
  canonicalPath,
  assertionsPath,
  outputPath,
  { check = false, executionReference } = {},
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
    executionReference,
  });
  const manifest =
    JSON.stringify(
      {
        canonicalPath,
        canonicalSha256: result.checksum,
        assertionsPath,
        assertionsSha256: result.assertionsChecksum,
        operationPath: outputPath,
        operationSha256: result.wrapperChecksum,
        mode:
          executionReference === undefined
            ? "apply"
            : "conditional-reconciliation",
        ...(executionReference === undefined ? {} : { executionReference }),
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
        "Stale checksum, ledger identity or wrapper/body drift; regenerate and re-review.",
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
    const [command, canonical, assertions, output, reference] =
      process.argv.slice(2);
    if (!["generate", "check", "reconcile"].includes(command) || !output)
      throw new Error(
        "Usage: manual-migration.mjs generate|check CANONICAL ASSERTIONS OPERATION; reconcile CANONICAL ASSERTIONS OPERATION EXACT_EXECUTION_REFERENCE",
      );
    const result = prepare(canonical, assertions, output, {
      check: command === "check",
      ...(command === "reconcile" ||
      (command === "check" && reference !== undefined)
        ? { executionReference: reference ?? "" }
        : {}),
    });
    console.log(
      `canonical sha256 ${result.checksum}\noperation sha256 ${result.wrapperChecksum}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
