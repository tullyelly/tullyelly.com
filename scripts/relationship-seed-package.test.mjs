import { test } from "@jest/globals";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  prepare102,
  derived102,
  canonicalPath,
} from "./prepare-relationship-seed-package.mjs";
import { hash } from "./manual-migration.mjs";
const read = (path) => readFileSync(path, "utf8");
const source = read(canonicalPath);
const review = JSON.parse(read("docs/evidence/wu-1267-reviewed-seeds.json"));
const baseline = JSON.parse(
  read("docs/evidence/wu-1267-readonly-seed-baseline.json"),
);
test("reviewed package binds canonical, ledger, manifest and exact preservation/conflict checks", () => {
  const r = prepare102(true);
  assert.ok(r.sql.includes(r.checksum));
  assert.ok(
    !/^\s*(?:UPDATE|DELETE FROM|INSERT INTO) dojo\.(?:tags|tag_relation|homie)\b/m.test(
      r.sql,
    ),
  );
  assert.ok(
    r.sql.indexOf("DO $effects$") <
      r.sql.indexOf("INSERT INTO dojo.schema_migration"),
  );
  assert.ok(source.includes("SET LOCAL TimeZone='UTC'"));
  assert.ok(source.includes("no overwrite"));
  assert.ok(source.includes("intentional removal"));
  assert.ok(
    source.includes("wu1267_homies_before EXCEPT SELECT * FROM dojo.homie"),
  );
  assert.notEqual(
    derived102(source.replace("wrong database", "unexpected database"))
      .checksum,
    r.checksum,
  );
  assert.throws(() =>
    derived102(source.replace("DO $effects$", "DO $missing$")),
  );
});
test("independent targets match, and only proven LeBron duplicate rows are archived", () => {
  assert.deepEqual(baseline.development, baseline.production);
  const rows = baseline.production.relations;
  for (const [oldId, currentId] of [
    [213, 462],
    [325, 463],
  ]) {
    const old = rows.find((r) => r.id === oldId),
      current = rows.find((r) => r.id === currentId);
    assert.equal(old.source_tag_id, 392);
    assert.equal(current.source_tag_id, 540);
    assert.equal(old.target_tag_id, current.target_tag_id);
    assert.equal(current.meta.original_edge_id, old.id);
    assert.deepEqual(current.meta.original_edge_meta, old.meta);
    assert.ok(source.includes("homie_sync_merged_edges"));
    assert.ok(source.includes(JSON.stringify(old).replaceAll("'", "''")));
  }
  assert.ok(!source.includes("DELETE FROM dojo.homie"));
  assert.ok(!source.includes("UPDATE dojo.homie"));
});
test("seed manifest keeps the family/athlete split, exact historic reason and unresolved exclusions", () => {
  assert.deepEqual(
    review.included.map((e) => [e.source, e.target, e.type]),
    [
      ["lebron-james", "king-james", "alias_of"],
      ["calvin", "cal", "alias_of"],
      ["king-james", "lulu", "collected_because_of"],
    ],
  );
  assert.equal(
    review.included[2].meta.reasons[0].explanation,
    "I collect LeBron because he was Lulu's favorite player.",
  );
  assert.ok(review.excluded.some((e) => e.candidate === "Calvin Reese -> cal"));
  for (const edge of review.included)
    assert.ok(source.includes(JSON.stringify(edge.meta).replaceAll("'", "''")));
});
test("each content correction changes only its reviewed literal prop, preserving every other byte", () => {
  assert.equal(review.contentChanges.length, 4);
  for (const change of review.contentChanges) {
    const actual = read(change.path);
    assert.equal(hash(actual), change.afterSha256);
    assert.ok(actual.includes(change.after));
    assert.ok(!actual.includes(change.before));
    assert.equal(
      hash(actual.replace(change.after, change.before)),
      change.beforeSha256,
    );
  }
  const mike = read("content/chronicles/mike-vick.mdx");
  assert.ok(mike.includes('<PersonTag displayName="james" tag="edgerrin" />'));
  assert.ok(mike.includes('<TagLink tag="cal">calvin</TagLink>'));
  const family = read("content/chronicles/silent-reflection.mdx");
  assert.ok(family.includes('<PersonTag displayName="calvin" tag="cal" />'));
});
