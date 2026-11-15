import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { derived098, prepare098 } from "./prepare-homie-identity-package.mjs";
import { hash } from "./manual-migration.mjs";
const read = (path) => readFileSync(path, "utf8");
const canonicalPath = "db/migrations/098_protect_homie_tag_identity.sql";
const ledgerPath = "db/operations/098_record_applied.sql";
const source = read(canonicalPath);
test("two-file package binds canonical checksum and checks effects before recording without replay", () => {
  const expected = prepare098(true);
  assert.equal(read(ledgerPath), expected.sql);
  assert.ok(read(ledgerPath).includes(hash(source)));
  assert.ok(!read(ledgerPath).includes("CREATE OR REPLACE FUNCTION"));
  assert.ok(!read(ledgerPath).includes("UPDATE dojo.homie"));
  assert.ok(
    read(ledgerPath).indexOf("DO $effects$") <
      read(ledgerPath).indexOf("INSERT INTO dojo.schema_migration"),
  );
  assert.ok(
    source.includes(
      "IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '098%')",
    ),
  );
  const definitions = source.match(
    /CREATE OR REPLACE FUNCTION[\s\S]*?\n\$fn\$;/g,
  );
  assert.equal(
    read("db/schema/functions/homie_tag_identity.sql")
      .split("\n")
      .slice(1)
      .join("\n"),
    definitions.join("\n\n") + "\n",
  );
});
test("write-path coverage preserves existing inference and keeps deterministic statement serialization", () => {
  assert.ok(
    source.includes(
      "ARRAY['homie','tags','tag_relation','unclejimmy_squad_item']",
    ),
  );
  assert.ok(source.includes("BEFORE INSERT OR UPDATE OR DELETE"));
  assert.ok(
    source.includes(
      "FOR EACH STATEMENT EXECUTE FUNCTION dojo.homie_identity_write_lock()",
    ),
  );
  assert.ok(source.includes("AFTER INSERT OR UPDATE OR DELETE"));
  assert.ok(
    source.includes(
      "current_setting('transaction_isolation') <> 'read committed'",
    ),
  );
  assert.ok(
    source.includes(
      "pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity', 0))",
    ),
  );
  assert.ok(!source.includes("DISABLE TRIGGER"));
  assert.ok(!source.includes("DROP TRIGGER trg_infer"));
  assert.ok(!source.includes("UPDATE dojo.homie SET name="));
  assert.ok(!source.includes("'alias_of'"));
  assert.ok(source.includes("jsonb_build_array(to_jsonb(edge))"));
});

test("unapplied source and effect changes invalidate ledger hashes and generated checks", () => {
  const changed = source.replace(
    "RAISE EXCEPTION '098: athlete identity/slug mismatch'",
    "RAISE EXCEPTION '098: changed assertion'",
  );
  const derived = derived098(changed);
  assert.ok(derived.artifacts[ledgerPath].includes(hash(changed)));
  assert.ok(derived.artifacts[ledgerPath].includes("changed assertion"));
  assert.notEqual(
    derived.result.ledgerChecksum,
    derived098(source).result.ledgerChecksum,
  );
});

test("trigger fingerprint guard has a transaction-local canonical search path before catalog rendering", () => {
  const path = source.indexOf("SET LOCAL search_path = pg_catalog;");
  assert.ok(
    path > source.indexOf("BEGIN;") && path < source.indexOf("DO $known$"),
  );
  assert.ok(source.indexOf("md5(pg_get_triggerdef") > path);
});

test("JSON extraction is grouped before removing preservation keys", () => {
  assert.ok(!/\.meta#>'[^']+'\s*-/.test(source));
  assert.ok(source.includes("(t.meta#>'{identity}') - 'kind'"));
  assert.ok(source.includes("(b.meta#>'{identity,contexts}') - 'cardattack'"));
});
