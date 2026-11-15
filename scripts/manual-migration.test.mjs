import { test } from "@jest/globals";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { bundle, migrationBody, hash, prepare } from "./manual-migration.mjs";
import { validateSchemaDeferral } from "./release/schema-deferral";
const input = {
  filename: "999_fixture.sql",
  source: "BEGIN;\nSELECT 1;\nCOMMIT;\n",
  assertions:
    "DO $$ BEGIN IF 1 <> 1 THEN RAISE EXCEPTION 'fixture'; END IF; END $$;",
};
test("canonical bytes, filename and source are bound to atomic ledger recording", () => {
  const r = bundle(input);
  assert.equal(r.checksum, hash(input.source));
  assert.notEqual(r.checksum, r.wrapperChecksum);
  assert.ok(
    r.sql.includes("EXECUTE $canonical_body$SELECT 1;$canonical_body$"),
  );
  assert.ok(
    r.sql.indexOf("EXECUTE $effect_assertions$") <
      r.sql.indexOf("INSERT INTO dojo.schema_migration"),
  );
  assert.ok(!r.sql.includes("ON CONFLICT"));
  assert.ok(r.sql.includes("filename = '999_fixture.sql'"));
  assert.notEqual(
    bundle({ ...input, source: input.source.replace("SELECT 1", "SELECT 2") })
      .sql,
    r.sql,
  );
  assert.notEqual(bundle({ ...input, filename: "999_other.sql" }).sql, r.sql);
  assert.notEqual(
    bundle({ ...input, assertions: input.assertions + "\nSELECT 2;" })
      .wrapperChecksum,
    r.wrapperChecksum,
  );
});
test("unsupported transaction shapes and empty or ambiguous reconciliation evidence fail", () => {
  for (const source of [
    "SELECT 1;",
    "BEGIN;\nCOMMIT;\nSELECT 1;\nCOMMIT;",
    "BEGIN;\n\\i other.sql\nCOMMIT;",
    "BEGIN;\nCREATE INDEX CONCURRENTLY x ON t(a);\nCOMMIT;",
  ])
    assert.throws(() => migrationBody(source));
  assert.throws(() => bundle({ ...input, executionReference: "" }), /evidence/);
  const r = bundle({
    ...input,
    executionReference:
      "fixture exact-file receipt and postflight, no live execution",
  });
  assert.ok(!r.sql.includes("EXECUTE $canonical_body$"));
  assert.ok(r.sql.includes("EXECUTE $effect_assertions$"));
});
test("complete guarded diff or live baseline changes invalidate release compatibility evidence", () => {
  const baseline = "a".repeat(40),
    diff = "earlier unreleased migration plus current migration";
  const review = {
    version: 1,
    scope: "application-only",
    baselineSha: baseline,
    schemaDiffSha256: hash(diff),
    rationale: "fixture only",
  };
  validateSchemaDeferral(review, baseline, diff);
  assert.throws(() => validateSchemaDeferral(review, "b".repeat(40), diff));
  assert.throws(() =>
    validateSchemaDeferral(review, baseline, diff + " changed source"),
  );
});

test("validator detects edited body, stale canonical bytes and changed ledger identity on disk", () => {
  const original = process.cwd(),
    dir = mkdtempSync(join(tmpdir(), "manual-package-"));
  try {
    process.chdir(dir);
    mkdirSync("db/migrations", { recursive: true });
    mkdirSync("db/operations");
    const canonical = "db/migrations/999_fixture.sql",
      assertions = "db/operations/999_assertions.sql",
      operation = "db/operations/999_apply_with_ledger.sql";
    writeFileSync(canonical, input.source);
    writeFileSync(assertions, input.assertions);
    prepare(canonical, assertions, operation);
    prepare(canonical, assertions, operation, { check: true });
    const correct = readFileSync(operation, "utf8");
    for (const mutation of [
      correct.replace("SELECT 1;", "SELECT 2;"),
      correct.replaceAll("999_fixture.sql", "999_wrong.sql"),
      correct.replaceAll(hash(input.source), "0".repeat(64)),
    ]) {
      writeFileSync(operation, mutation);
      assert.throws(
        () => prepare(canonical, assertions, operation, { check: true }),
        /drift/,
      );
    }
    writeFileSync(operation, correct);
    writeFileSync(canonical, input.source + "\n");
    assert.throws(
      () => prepare(canonical, assertions, operation, { check: true }),
      /drift/,
    );
  } finally {
    process.chdir(original);
    rmSync(dir, { recursive: true, force: true });
  }
});
