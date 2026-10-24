import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file: string) =>
  readFileSync(path.join(process.cwd(), file), "utf8");
const migration = read("db/migrations/079_remove_clan_tag_slug.sql");

describe("canonical clan slug migration", () => {
  it("replaces the legacy trigger before dropping the column without cascading", () => {
    expect(migration).toContain("AFTER INSERT OR UPDATE OF name, slug");
    expect(migration).toContain(
      "dojo.create_missing_clan_tag(NEW.slug, NEW.name)",
    );
    expect(migration).toContain("ON CONFLICT (slug) DO NOTHING");
    expect(migration).toContain("WHERE tag.slug = clan.slug");
    expect(migration).toContain("clan.tag_slug contains values; review them");
    expect(migration).toContain("DROP COLUMN IF EXISTS tag_slug RESTRICT");
    expect(migration).not.toMatch(/DROP[^;]*\bCASCADE\b/);
    expect(migration.indexOf("CREATE TRIGGER")).toBeLessThan(
      migration.indexOf("DROP COLUMN"),
    );
    expect(migration.trim()).toMatch(/COMMIT;$/);
  });

  it("keeps current schema mirrors in sync and preserves snapshot view access", () => {
    for (const name of [
      "create_missing_clan_tag",
      "create_missing_clan_tag_from_row",
    ]) {
      expect(migration).toContain(
        read(`db/schema/functions/${name}.sql`).trim(),
      );
    }
    for (const view of [
      "v_clan_tcdb_snapshot",
      "v_tcdb_trade_partner_content_tags",
    ]) {
      expect(migration).toContain(read(`db/schema/views/${view}.sql`).trim());
    }
    expect(read("db/schema/tables/clan.sql")).not.toContain("tag_slug");
    expect(migration).toContain("aclexplode(view_state.acl)");
    expect(migration).toContain("OWNER TO %I");
    expect(migration).toContain("view_state.reloptions");
  });

  it("removes clan column dependencies from current queries and results", () => {
    for (const file of [
      "lib/data/tcdb-clans.ts",
      "lib/data/tcdb-clan-snapshot.ts",
    ]) {
      expect(read(file)).not.toContain("tag_slug");
    }
    expect(read("lib/tcdb-trade-partners-db.ts")).not.toContain(
      "clan.tag_slug",
    );
    expect(
      read("app/cardattack/tcdb-trade-partners/[id]/page.tsx"),
    ).not.toContain("clan.tagSlug");
    expect(
      read("db/schema/views/v_tcdb_trade_partner_content_tags.sql"),
    ).toContain("tag.slug = clan.slug");
  });
});
