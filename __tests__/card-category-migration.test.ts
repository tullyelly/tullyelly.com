/** @jest-environment node */
import fs from "node:fs";
const schema = fs.readFileSync(
  "db/migrations/083_card_category_snapshots.sql",
  "utf8",
);
const access = fs.readFileSync(
  "db/migrations/084_card_category_access_and_menu.sql",
  "utf8",
);
const rankingMigration = fs.readFileSync(
  "db/migrations/085_card_category_rankings.sql",
  "utf8",
);
const differenceMigration = fs.readFileSync(
  "db/migrations/086_card_category_difference_and_trends.sql",
  "utf8",
);
it("keeps reference SQL aligned with migration definitions", () => {
  for (const file of [
    "tables/card_category",
    "tables/card_category_snapshot",
    "views/v_card_category_snapshot",
    "views/v_card_category_current",
  ]) {
    const reference = fs.readFileSync(`db/schema/${file}.sql`, "utf8");
    if (file.startsWith("views/"))
      expect(differenceMigration).toContain(reference);
    else
      expect(schema).toContain(
        reference
          .replace("  difference INTEGER,\n", "")
          .replace(
            "  ranking INTEGER CONSTRAINT card_category_snapshot_ranking_check CHECK (ranking >= 1),\n",
            "",
          ),
      );
  }
});
it("derives all history chronologically without persisted refresh or fabricated snapshots", () => {
  expect(schema).toContain("UNIQUE (category_id, measured_on)");
  expect(schema).toContain(
    "PARTITION BY category.id ORDER BY snapshot.measured_on",
  );
  expect(schema).toContain("ORDER BY history.measured_on DESC LIMIT 1");
  expect(schema).toContain("LEFT JOIN LATERAL");
  expect(schema).not.toMatch(
    /INSERT INTO dojo.card_category_snapshot|MATERIALIZED|ON DELETE CASCADE/,
  );
  expect(schema).toContain("card_count >= 0");
  expect(schema).toContain("AT TIME ZONE 'America/Chicago'");
});
it("resolves authorization/menu identities by stable keys and bumps affected revisions", () => {
  expect(access).toContain("role.name IN ('editor', 'admin')");
  expect(access).toContain(
    "membership.app_id IS NULL OR membership.app_id = feature.app_id",
  );
  expect(access).toContain("dojo.authz_bump_revision(affected)");
  expect(access).toContain("pg_notify('authz_changed'");
  expect(access).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/);
  expect(access).not.toContain("DO UPDATE SET effect");
});

it("adds optional rankings without rewriting existing measurements or migration history", () => {
  expect(rankingMigration).toContain("ADD COLUMN ranking INTEGER");
  expect(rankingMigration).toContain("CHECK (ranking >= 1)");
  expect(rankingMigration).toContain(
    "lag(snapshot.ranking) OVER chronology - snapshot.ranking AS rank_delta",
  );
  expect(rankingMigration).toContain(
    "snapshot.ranking IS NULL OR lag(snapshot.ranking) OVER chronology IS NULL THEN NULL",
  );
  expect(rankingMigration).not.toMatch(
    /UPDATE dojo.card_category_snapshot|INSERT INTO dojo.card_category_snapshot|DROP VIEW|DROP TABLE/,
  );
});

it("adds signed difference and rank-first overall trends without inventing missing baselines", () => {
  expect(differenceMigration).toContain("ADD COLUMN difference INTEGER");
  expect(differenceMigration).toContain(
    "snapshot.difference::bigint - (lag(snapshot.difference) OVER chronology)::bigint AS diff_delta",
  );
  const trend = differenceMigration.slice(
    differenceMigration.indexOf("END AS trend_rank"),
    differenceMigration.indexOf("END AS trend_overall"),
  );
  expect(trend.indexOf("snapshot.ranking <")).toBeLessThan(
    trend.indexOf("snapshot.difference >"),
  );
  expect(trend).toContain(
    "snapshot.difference IS NULL OR lag(snapshot.difference) OVER chronology IS NULL THEN NULL",
  );
  expect(differenceMigration).toContain("snapshot.difference >= 0");
  expect(differenceMigration).toContain("snapshot.difference < 0");
  expect(differenceMigration).not.toMatch(
    /UPDATE dojo.card_category_snapshot|INSERT INTO dojo.card_category_snapshot|DROP TABLE|DROP VIEW/,
  );
});
