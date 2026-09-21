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
