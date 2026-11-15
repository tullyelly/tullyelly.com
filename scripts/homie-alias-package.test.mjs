import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  prepare101,
  derived101,
  canonicalPath,
} from "./prepare-homie-alias-package.mjs";
const source = readFileSync(canonicalPath, "utf8");
test("101 binds canonical/definitions/effects without replaying synchronization in its ledger", () => {
  const { sql, checksum } = prepare101(true);
  assert.ok(sql.includes(checksum));
  assert.ok(
    sql.indexOf("DO $effects$") <
      sql.indexOf("INSERT INTO dojo.schema_migration"),
  );
  assert.ok(!sql.includes("CREATE OR REPLACE FUNCTION"));
  assert.ok(!sql.includes("DELETE FROM dojo.tag_relation"));
  assert.notEqual(
    derived101(source.replace("null slug would strand", "null slug strands"))
      .result.checksum,
    checksum,
  );
  assert.ok(
    source.includes(
      "wu1264_edges_before EXCEPT SELECT * FROM dojo.tag_relation",
    ),
  );
  assert.ok(
    source.includes(
      "retired_aliases := retired_aliases||jsonb_build_array(item)",
    ),
  );
  assert.ok(source.includes("homie_alias_retarget_history"));
  assert.ok(!source.includes("DISABLE TRIGGER"));
});
