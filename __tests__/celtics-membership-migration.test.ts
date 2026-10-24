import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/082_add_celtics_player_memberships.sql",
  ),
  "utf8",
);
const values = migration.match(
  /INSERT INTO celtics_player_seed[^;]+?VALUES\n([\s\S]+?);/,
)?.[1];
if (!values) throw new Error("Missing Celtics seed");
const players = values
  .split("\n")
  .filter(Boolean)
  .map((line) =>
    Array.from(line.matchAll(/'((?:''|[^'])*)'/g), (match) =>
      match[1].replaceAll("''", "'"),
    ),
  );
const slugs = new Set(players.map((row) => row[1]));

describe("Celtics membership backfill", () => {
  it("uses the 22 reviewed existing identities, including short playing stints", () => {
    expect(players).toHaveLength(22);
    expect(slugs.size).toBe(players.length);
    for (const [name, slug, evidence] of players) {
      expect(name).toBeTruthy();
      expect(slug).not.toBe("green-beer");
      expect(new URL(evidence).protocol).toBe("https:");
    }
    for (const slug of [
      "big-deuce",
      "larry-bird",
      "the-big-ticket",
      "jesus",
      "diesel",
      "jrue",
      "blue",
      "marty-conlon",
      "day",
      "sherminator",
      "vin",
      "jabari",
      "justin-jackson",
      "robert-parish",
    ])
      expect(slugs.has(slug)).toBe(true);
    for (const slug of [
      "justin",
      "wes-matthews",
      "j-kidd",
      "pops-junior",
      "kobe",
      "magic",
      "cole",
      "herro",
    ])
      expect(slugs.has(slug)).toBe(false);
  });

  it("targets green-beer and changes only relationships", () => {
    expect(migration).toContain("clan.slug = 'green-beer'");
    expect(migration).not.toContain("purple-and-gold");
    expect(migration).toContain("source_tag.id, target_tag.id, 'member_of'");
    expect(migration).toContain(
      "ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING",
    );
    expect(migration).not.toMatch(
      /INSERT INTO dojo\.(homie|tags|clan)\b|UPDATE dojo\.|DELETE FROM|DO UPDATE/,
    );
    expect(migration).not.toMatch(/WHERE\s+(?:homie\.)?id\s*=\s*\d+/i);
  });

  it("retains strict endpoint checks with useful errors and one transaction", () => {
    expect(migration).toContain(
      "homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug",
    );
    expect(migration).toContain(
      "Celtics clan or canonical tag is missing: green-beer",
    );
    expect(migration).toContain("USING DETAIL = endpoint_problems");
    expect(migration).toContain(
      "a reviewed Celtics membership was not inserted",
    );
    expect(migration.indexOf("BEGIN;")).toBeLessThan(
      migration.indexOf("INSERT INTO dojo.tag_relation"),
    );
    expect(migration.trim()).toMatch(/COMMIT;$/);
  });
});
