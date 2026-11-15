import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  derived100,
  prepare100,
  canonicalPath,
} from "./prepare-typed-relationships-package.mjs";
const read = (path) => readFileSync(path, "utf8");
const source = read(canonicalPath);
test("ledger binds source/definitions and cannot replay migration or data", () => {
  const { sql, checksum } = prepare100(true);
  assert.ok(sql.includes(checksum));
  assert.ok(
    sql.indexOf("DO $effects$") <
      sql.indexOf("INSERT INTO dojo.schema_migration"),
  );
  assert.ok(!sql.includes("CREATE OR REPLACE"));
  assert.ok(
    !/\b(?:INSERT INTO dojo.tag_relation|UPDATE dojo.tags|DELETE FROM)\b/.test(
      sql,
    ),
  );
  const changed = derived100(
    source.replace("nonblank explanations", "reviewed explanations"),
  );
  assert.notEqual(changed.result.checksum, checksum);
  assert.notEqual(changed.result.sql, sql);
  assert.throws(() =>
    derived100(source.replace("DO $effects$", "DO $missing$")),
  );
});
test("guards preserve shared serialization, unrelated rows and member-only traversal", () => {
  assert.ok(source.includes("cipher:homie-tag-identity"));
  assert.ok(
    source.includes(
      "ARRAY['homie','tags','tag_relation','unclejimmy_squad_item','clan']",
    ),
  );
  assert.ok(
    source.includes(
      "wu1263_edges_before EXCEPT SELECT * FROM dojo.tag_relation",
    ),
  );
  assert.ok(
    source.includes("wu1263_tags_before EXCEPT SELECT * FROM dojo.tags"),
  );
  assert.ok(
    !/\b(?:UPDATE|DELETE FROM|INSERT INTO) dojo\.(?:tags|tag_relation|homie)\b/.test(
      source,
    ),
  );
  const view = read("db/schema/views/v_tag_relationships.sql");
  assert.ok(!view.includes("alias_of"));
  assert.ok(!view.includes("collected_because_of"));
});

test("DataGrip CRLF function bodies match without accepting a changed definition", () => {
  const lf = derived100(source).result;
  const crlf = derived100(source.replaceAll("\n", "\r\n")).result;
  const fingerprints = (sql) =>
    sql.match(
      /\('(?:valid_collection_reasons|canonical_tag_id|tag_known_owner|assert_typed_tag_relationships|check_typed_tag_relationships)','[a-f0-9]{32}'\)/g,
    );
  assert.deepEqual(fingerprints(crlf.sql), fingerprints(lf.sql));
  assert.notEqual(crlf.checksum, lf.checksum); // Canonical file bytes remain exact.
  assert.ok(lf.sql.includes("md5(replace(p.prosrc,E'\\r\\n',E'\\n'))<>e.hash"));
  const changed = derived100(
    source.replace("nonblank explanations", "different explanation contract"),
  ).result;
  assert.notDeepEqual(fingerprints(changed.sql), fingerprints(lf.sql));
  // A standalone CR is not a CRLF line ending and must still change the fingerprint.
  const standalone = derived100(
    source.replace("DECLARE reason jsonb;", "DECLARE reason jsonb;\r"),
  ).result;
  assert.notDeepEqual(fingerprints(standalone.sql), fingerprints(lf.sql));
});
