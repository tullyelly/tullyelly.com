import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/087_add_marquette_player_memberships.sql",
  ),
  "utf8",
);

describe("Marquette membership migration", () => {
  it("uses the three reviewed production identities and college evidence", () => {
    const seed = migration.match(
      /INSERT INTO marquette_player_seed[^;]+;/,
    )?.[0];
    expect(seed).toBeDefined();
    expect(seed?.match(/https:\/\/gomarquette.com\//g)).toHaveLength(3);
    for (const pair of [
      "('Dwyane Wade', 'flash'",
      "('Jimmy Butler', 'playoff-jimmy'",
      "('Wes Matthews', 'wes-matthews'",
    ])
      expect(seed).toContain(pair);
    expect(migration).toContain("clan.slug = 'golden-eagles'");
    expect(migration).toContain("'affiliation_scope', 'college'");
    expect(migration).toContain("'membership_basis', 'played_for'");
  });

  it("fails on changed identities and preserves existing relationships", () => {
    expect(migration).toContain(
      "homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug",
    );
    expect(migration).toContain("USING DETAIL = endpoint_problems");
    expect(migration).toContain(
      "a reviewed Marquette membership was not inserted",
    );
    expect(migration).toContain(
      "ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING",
    );
    expect(migration).not.toMatch(
      /INSERT INTO dojo\.(homie|tags|clan)\b|UPDATE dojo\.|DELETE FROM|DO UPDATE/,
    );
    expect(migration).toContain("source_tag.id, target_tag.id, 'member_of'");
    expect(migration.trim()).toMatch(/COMMIT;$/);
  });
});
