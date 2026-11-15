import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { derived098, prepare098 } from "./prepare-homie-identity-package.mjs";
import { bundle, hash, prepare } from "./manual-migration.mjs";
const read = (path) => readFileSync(path, "utf8");
const canonicalPath = "db/migrations/098_protect_homie_tag_identity.sql";
const assertionsPath = "db/operations/098_identity_assertions.sql";
const operationPath = "db/operations/098_apply_with_ledger.sql";
const source = read(canonicalPath),
  assertions = read(assertionsPath);
test("098 atomic package matches finalized canonical source, assertions, manifest and postflight identity", () => {
  prepare(canonicalPath, assertionsPath, operationPath, { check: true });
  const expected = bundle({
    filename: "098_protect_homie_tag_identity.sql",
    source,
    assertions,
  });
  assert.equal(read(operationPath), expected.sql);
  assert.ok(
    read("db/operations/098_identity_postflight.sql").includes(hash(source)),
  );
  assert.ok(
    read("db/operations/098_identity_preflight.sql").includes(hash(source)),
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
test("read-only pre/postflight contain no DDL/DML or write-producing runner calls", () => {
  for (const path of [
    "db/operations/098_identity_preflight.sql",
    "db/operations/098_identity_postflight.sql",
  ]) {
    const sql = read(path).replace(/--[^\n]*/g, "");
    assert.ok(sql.includes("BEGIN READ ONLY;"));
    assert.ok(
      !/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\b/i.test(
        sql,
      ),
    );
    assert.ok(!sql.includes("db:migrate:"));
  }
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

test("unapplied source changes regenerate every task checksum and schema reference", () => {
  prepare098(true);
  const changed = source.replace(
    "'cipher:homie-tag-identity'",
    "'cipher:fixture-change'",
  );
  const derived = derived098(
    changed,
    read("db/operations/098_identity_preflight.sql"),
    read("db/operations/098_identity_postflight.sql"),
  );
  assert.ok(
    derived["db/operations/098_identity_preflight.sql"].includes(hash(changed)),
  );
  assert.ok(
    derived["db/operations/098_identity_postflight.sql"].includes(
      hash(changed),
    ),
  );
  assert.ok(
    !derived["db/operations/098_identity_preflight.sql"].includes(hash(source)),
  );
});
