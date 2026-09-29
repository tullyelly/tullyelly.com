import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = readFileSync(
  path.join(root, "db/migrations/075_create_tag_relationships_view.sql"),
  "utf8",
);
const schema = readFileSync(
  path.join(root, "db/schema/views/v_tag_relationships.sql"),
  "utf8",
);
const databaseTest = readFileSync(
  path.join(root, "db/tests/075_v_tag_relationships_test.sql"),
  "utf8",
);

describe("tag relationships view migration", () => {
  test("creates the regular read-only view and its schema mirror", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_tag_relationships",
    );
    expect(schema).toContain("CREATE OR REPLACE VIEW dojo.v_tag_relationships");
    expect(migration).not.toMatch(/MATERIALIZED\s+VIEW/i);
  });

  test("exposes direct edges from both perspectives", () => {
    expect(migration).toContain("'outgoing'::TEXT AS relationship_direction");
    expect(migration).toContain("'incoming'::TEXT AS relationship_direction");
    expect(migration).toContain("relation.id AS direct_relation_id");
    expect(migration).toContain(
      "relation.source_tag_id AS direct_source_tag_id",
    );
    expect(migration).toContain(
      "relation.target_tag_id AS direct_target_tag_id",
    );
    expect(migration).toContain("relation.meta AS direct_relation_meta");
  });

  test("preserves cycle-safe membership paths without a depth cap", () => {
    expect(migration).toContain("WITH RECURSIVE");
    expect(migration).toContain(
      "path.path_tag_ids || next_step.related_tag_id",
    );
    expect(migration).toContain(
      "NOT next_step.related_tag_id = ANY(path.path_tag_ids)",
    );
    expect(migration).toContain("WHERE path.depth > 1");
    expect(migration).not.toMatch(/depth\s*<\s*\d+/i);
  });

  test("preserves isolated tags with null relationship fields", () => {
    expect(migration).toContain("isolated_tags AS");
    expect(migration).toContain("WHERE NOT EXISTS (");
    expect(migration).toContain("NULL::BIGINT AS direct_relation_id");
  });

  test("ships transactional database coverage for the requested cases", () => {
    for (const marker of [
      "incoming and outgoing direct relationships",
      "multiple relationship types",
      "nested membership ancestors and descendants",
      "multiple distinct membership paths",
      "cycles remain finite",
      "isolated tags",
    ]) {
      expect(databaseTest).toContain(marker);
    }
    expect(databaseTest).toContain("ROLLBACK;");
  });
});
