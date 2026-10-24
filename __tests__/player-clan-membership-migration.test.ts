import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/080_populate_player_clan_memberships.sql",
  ),
  "utf8",
);

function seedRows(table: string): string[][] {
  const values = migration.match(
    new RegExp(`INSERT INTO ${table}\\s*\\([^;]+?\\) VALUES\\n([\\s\\S]+?);`),
  )?.[1];
  if (!values) throw new Error(`Missing seed values for ${table}`);
  return values
    .split("\n")
    .filter(Boolean)
    .map((line) =>
      Array.from(line.matchAll(/'((?:''|[^'])*)'/g), (match) =>
        match[1].replaceAll("''", "'"),
      ),
    );
}

const tagRows = seedRows("player_tag_seed");
const memberships = seedRows("player_clan_seed");
const pairs = new Set(memberships.map((row) => `${row[1]}:${row[2]}`));

describe("reviewed player clan membership backfill", () => {
  it("fills only unambiguous missing identities, including older branch gaps", () => {
    expect(tagRows).toHaveLength(115);
    expect(new Set(tagRows.map((row) => row[0])).size).toBe(tagRows.length);
    expect(new Set(tagRows.map((row) => row[1])).size).toBe(tagRows.length);
    for (const [name, slug] of tagRows) {
      expect(name).not.toMatch(/^(backfill|Peter Warrick|Tiger Woods)$/);
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    expect(tagRows).toContainEqual(["Aaron Rodgers", "aaron-rodgers"]);
    expect(tagRows).toContainEqual(["Dell Curry", "dell"]);
    expect(tagRows).toContainEqual(["Tobias Harris", "tobias"]);
    expect(migration).toContain("homie.tag_slug IS NULL");
    expect(migration).toContain("count(homie.id) <> 1");
    expect(migration).toContain("proposed player tag slug already belongs");
    expect(migration).toContain("required homie tag synchronization trigger");
  });

  it("bootstraps only the two reviewed missing reference clans", () => {
    expect(seedRows("player_clan_reference_seed")).toEqual([
      ["Portland Trail Blazers", "blazers"],
      ["Phoenix Suns", "suns"],
    ]);
    expect(migration).toContain("INSERT INTO dojo.clan (name, slug)");
    expect(migration).toContain("ON CONFLICT (slug) DO NOTHING");
    expect(migration).toContain(
      "dojo.create_missing_clan_tag(clan.slug, clan.name)",
    );
    expect(migration).toContain("migration 079 is missing or disabled");
  });

  it("contains unique evidence-backed directed player-to-team pairs", () => {
    expect(memberships).toHaveLength(214);
    expect(pairs.size).toBe(memberships.length);
    for (const [name, source, target, scope, evidence] of memberships) {
      expect(name).toBeTruthy();
      expect(source).not.toBe(target);
      expect(["college", "professional"]).toContain(scope);
      expect(new URL(evidence).protocol).toBe("https:");
    }
    for (const pair of [
      "bucks-in-six:bucks-n-six",
      "jon-mcglocklin:rockets",
      "freak:bucks-n-six",
      "freak:heat-culture",
      "lamelo:t-wolves",
      "aaron-rodgers:lombardi",
      "jagr:capitals",
      "t-brandon:ducks",
      "bob-sura:noles",
      "bob-sura:rockets",
      "warrick:noles",
    ])
      expect(pairs.has(pair)).toBe(true);
    for (const pair of [
      "td:ducks",
      "teemu:ducks",
      "j-kidd:bucks-n-six",
      "cal:brew-crew",
      "jon-mcglocklin:blazers",
      "ingles:blazers",
      "pau-gasol:blazers",
    ])
      expect(pairs.has(pair)).toBe(false);
  });

  it("uses runtime keys, preserves existing edges and aborts on drift", () => {
    expect(migration).toContain("LOCK TABLE dojo.homie, dojo.clan, dojo.tags");
    expect(migration).toContain("homie.tag_slug = seed.source_slug");
    expect(migration).toContain("clan.slug = seed.clan_slug");
    expect(migration).toContain("source_tag.id, target_tag.id, 'member_of'");
    expect(migration).toContain(
      "ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING",
    );
    expect(migration).toContain(
      "a reviewed player/clan endpoint is missing or changed",
    );
    expect(migration).toContain("USING DETAIL = endpoint_problems");
    expect(migration).toContain("homie name/tag assignment missing or changed");
    expect(migration).toContain("'player tag missing'");
    expect(migration).toContain("'clan missing'");
    expect(migration).toContain("'clan tag missing'");
    expect(migration).not.toMatch(/DELETE FROM|UPDATE dojo\.tags|DO UPDATE/);
    expect(migration).not.toMatch(/WHERE\s+(?:homie\.)?id\s*=\s*\d+/i);
    expect(migration.indexOf("BEGIN;")).toBeLessThan(
      migration.indexOf("UPDATE dojo.homie"),
    );
    expect(migration.trim()).toMatch(/COMMIT;$/);
  });
});
