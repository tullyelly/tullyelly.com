import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(process.cwd(), "db/migrations/070_create_tag_relations.sql"),
  "utf8",
);

describe("tag relation migration", () => {
  test("enforces directed uniqueness, valid names, no self-relations, and lookup indexes", () => {
    expect(migration).toContain(
      "UNIQUE (source_tag_id, relation_type, target_tag_id)",
    );
    expect(migration).toContain("CHECK (btrim(relation_type) <> '')");
    expect(migration).toContain("CHECK (source_tag_id <> target_tag_id)");
    expect(migration).toContain("tag_relation_source_lookup_idx");
    expect(migration).toContain("tag_relation_target_lookup_idx");
    expect(migration).not.toContain("relation_type IN (");
  });

  test("derives CardAttack metadata from tag_slug joins without database IDs", () => {
    expect(migration).toContain("FROM dojo.homie AS homie");
    expect(migration).toContain("FROM dojo.clan AS clan");
    expect(migration).toContain("NULLIF(btrim(homie.tag_slug), '') = tag.slug");
    expect(migration).toContain("NULLIF(btrim(clan.tag_slug), '') = tag.slug");
    expect(migration).toContain("'/cardattack/homies/' || tag.slug");
    expect(migration).toContain("'/cardattack/clans/' || tag.slug");
  });

  test("classifies only Uncle Jimmy people and teams as identities", () => {
    expect(migration).toContain("FROM dojo.unclejimmy_squad_item AS item");
    expect(migration).toContain("item.kind IN ('person', 'team')");
    expect(migration).toContain("WHEN 'person' THEN 'person' ELSE 'group'");
    expect(migration).toContain("WHEN 'person' THEN 'fam' ELSE 'squad'");
  });

  test("merges nested metadata and preserves legacy squad route fields", () => {
    expect(migration).toContain("COALESCE(tag.meta->'identity', '{}'::jsonb)");
    expect(migration).toContain(
      "COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)",
    );
    expect(migration).not.toMatch(/SET\s+meta\s*=\s*jsonb_build_object/);
    expect(migration).not.toMatch(/SET\s+href\s*=/);
    expect(migration).not.toMatch(/SET\s+href_kind\s*=/);
  });
});
