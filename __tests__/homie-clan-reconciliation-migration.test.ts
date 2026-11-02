import { readFileSync } from "node:fs";
import path from "node:path";

const read = (file: string) =>
  readFileSync(path.join(process.cwd(), file), "utf8");
const aliases = read("db/migrations/090_restore_homie_alias_memberships.sql");
const careers = read("db/migrations/091_complete_homie_clan_memberships.sql");
const comparison = read("db/tests/090_091_homie_clan_memberships_check.sql");

function seedRows(sql: string) {
  const seed = sql.match(/INSERT INTO homie_\w+_seed[\s\S]*?;/)?.[0];
  return [...(seed ?? "").matchAll(/\('([^']+)', '([^']+)', '([^']+)'/g)];
}

describe("homie/clan reconciliation migrations", () => {
  it("restores only the twelve reviewed alias pairs with original evidence", () => {
    expect(seedRows(aliases)).toHaveLength(12);
    expect(aliases).toContain("legacy_relation.meta || jsonb_build_object(");
    expect(aliases).toContain("'copied_from_slug', seed.legacy_slug");
    expect(aliases).toContain("OR legacy_relation.id IS NULL");
    expect(aliases).toContain(
      "'Wes Matthews', 'wes', 'wes-matthews', 'golden-eagles'",
    );
  });

  it("adds eighteen verified career pairs, including nine Grizzlies pairs", () => {
    const rows = seedRows(careers);
    expect(rows).toHaveLength(18);
    expect(rows.filter((row) => row[3] === "vancouver")).toHaveLength(9);
    expect(new Set(rows.map((row) => `${row[2]}:${row[3]}`)).size).toBe(18);
    expect(careers).toContain("'membership_basis', 'played_for'");
    expect(careers).not.toMatch(/'backfill'|'cal'|'tiger'|'warrick'/);
  });

  it.each([aliases, careers])(
    "guards identities and preserves existing data",
    (sql) => {
      expect(sql).toContain(
        "homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug",
      );
      expect(sql).toContain(
        "WHERE candidate.tag_slug = seed.source_slug) <> 1",
      );
      expect(sql).toContain("USING DETAIL = endpoint_problems");
      expect(sql).toContain(
        "ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING",
      );
      expect(sql).toContain("a reviewed membership was not inserted");
      expect(sql).not.toMatch(
        /INSERT INTO dojo\.(homie|clan|tags)\b|UPDATE dojo\.|DELETE FROM|DO UPDATE|CREATE (?:OR REPLACE )?FUNCTION/,
      );
      expect(sql.trim()).toMatch(/COMMIT;$/);
    },
  );

  it("provides a read-only comparison of every reviewed pair", () => {
    expect(comparison).toContain("BEGIN READ ONLY;");
    expect(comparison).not.toMatch(/INSERT|UPDATE|DELETE|CREATE|PERFORM/);
    const rows = comparison.match(/\('[^']+', '[^']+', '[^']+'\)/g) ?? [];
    expect(rows).toHaveLength(30);
    for (const row of seedRows(careers)) {
      expect(comparison).toContain(`('${row[1]}', '${row[2]}', '${row[3]}')`);
    }
  });
});
