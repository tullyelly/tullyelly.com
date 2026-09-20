import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/073_sync_homie_and_tag_identity_metadata.sql",
  ),
  "utf8",
);

describe("identity synchronization triggers", () => {
  test("infers theabbott metadata only from unambiguous routes", () => {
    expect(migration).toContain("NEW.href LIKE '/theabbott/homies/%'");
    expect(migration).toContain("NEW.href LIKE '/theabbott/clans/%'");
    expect(migration).toContain(
      "BEFORE INSERT OR UPDATE OF slug, href, href_kind, meta",
    );
    expect(migration).toContain("context || jsonb_build_object");
  });

  test("synchronizes non-empty homie tag slugs without hardcoded IDs", () => {
    expect(migration).toContain("AFTER INSERT OR UPDATE OF name, tag_slug");
    expect(migration).toContain("ON CONFLICT (slug) DO UPDATE");
    expect(migration).toContain("'/cardattack/homies/' || normalized_slug");
    expect(migration).toMatch(
      /COALESCE\(\s*dojo\.tags\.meta->'identity'->'contexts'/,
    );
    expect(migration).not.toMatch(/WHERE\s+id\s*=\s*\d+/);
  });

  test("backfills existing qualifying rows through the trigger functions", () => {
    expect(migration).toContain("PERFORM dojo.sync_homie_tag_identity(");
    expect(migration).toContain("UPDATE dojo.tags\nSET meta = meta");
  });
});
