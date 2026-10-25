import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/073_sync_homie_and_tag_identity_metadata.sql",
  ),
  "utf8",
);
const canonicalRouteMigration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/074_infer_identity_metadata_from_canonical_routes.sql",
  ),
  "utf8",
);
const clanTagMigration = readFileSync(
  path.join(process.cwd(), "db/migrations/078_create_missing_clan_tags.sql"),
  "utf8",
);

describe("identity synchronization triggers", () => {
  test("clan tag creation preserves existing canonical tags", () => {
    expect(clanTagMigration).toContain("ON CONFLICT (slug) DO NOTHING");
    expect(clanTagMigration).not.toMatch(
      /DO UPDATE|UPDATE\s+dojo\.tags|DELETE FROM/i,
    );
    expect(clanTagMigration).not.toMatch(/SECURITY DEFINER|DISABLE TRIGGER/i);
    expect(clanTagMigration).toContain(
      "'/cardattack/clans/' || normalized_slug",
    );
    expect(clanTagMigration).toContain(
      "lower(COALESCE(NULLIF(btrim(p_clan_name), ''), normalized_slug))",
    );
  });

  test("clan tags use stable slugs for inserts and delayed tag assignments", () => {
    expect(clanTagMigration).toContain(
      "AFTER INSERT OR UPDATE OF name, tag_slug",
    );
    expect(clanTagMigration).toContain("ON dojo.clan");
    expect(clanTagMigration).toContain("IF normalized_slug IS NULL THEN");
    expect(clanTagMigration).toContain("NEW.tag_slug, NEW.name");
    expect(clanTagMigration).not.toMatch(/WHERE\s+id\s*=\s*\d+/);
  });

  test("backfills only missing clan tags in the trigger installation transaction", () => {
    expect(clanTagMigration.indexOf("BEGIN;")).toBeLessThan(
      clanTagMigration.indexOf("CREATE TRIGGER"),
    );
    expect(clanTagMigration).toMatch(
      /AND NOT EXISTS \([\s\S]*tag\.slug = clan\.tag_slug/,
    );
    expect(clanTagMigration).toContain(
      "dojo.create_missing_clan_tag(clan_row.tag_slug, clan_row.name)",
    );
    expect(clanTagMigration.trim()).toMatch(/COMMIT;$/);
  });

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

  test.each([
    ["homie", "/cardattack/homies/%", "cardattack", "person", "homie"],
    ["clan", "/cardattack/clans/%", "cardattack", "group", "clan"],
    ["homie", "/theabbott/homies/%", "theabbott", "person", "homie"],
    ["clan", "/theabbott/clans/%", "theabbott", "group", "clan"],
    ["squad", "/unclejimmy/fam/%", "unclejimmy", "person", "fam"],
    ["squad", "/unclejimmy/squads/%", "unclejimmy", "group", "squad"],
  ])(
    "infers %s %s as a %s %s identity with role %s",
    (hrefKind, href, context, kind, role) => {
      expect(canonicalRouteMigration).toContain(
        `NEW.href_kind = '${hrefKind}'`,
      );
      expect(canonicalRouteMigration).toContain(`NEW.href LIKE '${href}'`);
      expect(canonicalRouteMigration).toContain(
        `identity_context := '${context}'`,
      );
      expect(canonicalRouteMigration).toContain(`identity_kind := '${kind}'`);
      expect(canonicalRouteMigration).toContain(`context_role := '${role}'`);
    },
  );

  test("replaces the narrow trigger and backfills only unambiguous routes", () => {
    expect(canonicalRouteMigration).toContain(
      "DROP TRIGGER IF EXISTS trg_infer_theabbott_tag_identity",
    );
    expect(canonicalRouteMigration).toContain(
      "CREATE TRIGGER trg_infer_tag_identity_from_canonical_route",
    );
    expect(canonicalRouteMigration).toContain(
      "BEFORE INSERT OR UPDATE OF slug, href, href_kind, meta",
    );
    expect(canonicalRouteMigration).toContain("contexts->identity_context");
    expect(canonicalRouteMigration).toContain("context || jsonb_build_object");
    expect(canonicalRouteMigration).toContain(
      "UPDATE dojo.tags\nSET meta = meta",
    );
    expect(canonicalRouteMigration).not.toContain(
      "NEW.href LIKE '/unclejimmy/squad/%'",
    );
    expect(canonicalRouteMigration).not.toContain(
      "href LIKE '/unclejimmy/squad/%'",
    );
  });
});
