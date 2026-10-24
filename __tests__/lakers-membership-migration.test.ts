import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/081_add_lakers_player_memberships.sql",
  ),
  "utf8",
);
const values = migration.match(
  /INSERT INTO lakers_player_seed[^;]+?VALUES\n([\s\S]+?);/,
)?.[1];
if (!values) throw new Error("Missing Lakers seed");
const players = values
  .split("\n")
  .filter(Boolean)
  .map((line) =>
    Array.from(line.matchAll(/'((?:''|[^'])*)'/g), (match) =>
      match[1].replaceAll("''", "'"),
    ),
  );
const slugs = new Set(players.map((row) => row[1]));

describe("Lakers membership backfill", () => {
  it("uses 20 unique existing player identities with primary evidence", () => {
    expect(players).toHaveLength(20);
    expect(slugs.size).toBe(players.length);
    for (const [name, slug, evidence] of players) {
      expect(name).toBeTruthy();
      expect(slug).not.toBe("purple-and-gold");
      expect(new URL(evidence).hostname).toBe("www.nba.com");
    }
    for (const slug of [
      "kareem",
      "magic",
      "kobe",
      "diesel",
      "ad",
      "luka",
      "lebron-james",
      "sterling-brown",
      "kostas-antetokounmpo",
      "wes-matthews",
    ])
      expect(slugs.has(slug)).toBe(true);
    for (const slug of [
      "pops-junior",
      "justin",
      "marjon",
      "john-henson",
      "j-kidd",
      "isiah-thomas",
      "ervin-johnson",
      "johnny-newman",
    ])
      expect(slugs.has(slug)).toBe(false);
  });

  it("targets the live Lakers slug and preserves existing records", () => {
    expect(migration).toContain("clan.slug = 'purple-and-gold'");
    expect(migration).toContain("source_tag.id, target_tag.id, 'member_of'");
    expect(migration).toContain(
      "ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING",
    );
    expect(migration).not.toMatch(
      /INSERT INTO dojo\.(homie|tags|clan)\b|UPDATE dojo\.|DELETE FROM|DO UPDATE/,
    );
    expect(migration).not.toMatch(/WHERE\s+(?:homie\.)?id\s*=\s*\d+/i);
  });

  it("validates every endpoint and fails with actionable details", () => {
    expect(migration).toContain(
      "homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug",
    );
    expect(migration).toContain(
      "Lakers clan or canonical tag is missing: purple-and-gold",
    );
    expect(migration).toContain("USING DETAIL = endpoint_problems");
    expect(migration).toContain(
      "a reviewed Lakers membership was not inserted",
    );
    expect(migration.indexOf("BEGIN;")).toBeLessThan(
      migration.indexOf("INSERT INTO dojo.tag_relation"),
    );
    expect(migration.trim()).toMatch(/COMMIT;$/);
  });
});
