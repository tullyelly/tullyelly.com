/** @jest-environment node */

import { readFileSync } from "fs";

describe("TCDB refresh SQL", () => {
  const migration = readFileSync(
    "db/migrations/063_incremental_tcdb_ranking_refresh.sql",
    "utf8",
  );

  it("adds keyed refresh helpers for homie and clan rankings", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_snapshot_rt(p_homie_id BIGINT)",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_ranking_rt(p_homie_id BIGINT)",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_snapshot_rt(",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_ranking_rt(",
    );
    expect(migration).toContain("WHERE homie_id = p_homie_id");
    expect(migration).toContain("WHERE clan_id = p_clan_id");
    expect(migration).toContain("AND sport = p_sport");
  });

  it("refreshes affected keys for row writes and keeps full rebuilds for truncate", () => {
    expect(migration).toContain(
      "IF TG_OP = 'TRUNCATE' THEN\n    PERFORM dojo.refresh_homie_tcdb_ranking_rt();",
    );
    expect(migration).toContain(
      "IF TG_OP = 'TRUNCATE' THEN\n    PERFORM dojo.refresh_clan_tcdb_ranking_rt();",
    );
    expect(migration).toContain(
      "PERFORM dojo.refresh_homie_tcdb_ranking_rt(OLD.homie_id);",
    );
    expect(migration).toContain(
      "PERFORM dojo.refresh_homie_tcdb_ranking_rt(NEW.homie_id);",
    );
    expect(migration).toContain(
      "PERFORM dojo.refresh_clan_tcdb_ranking_rt(OLD.clan_id, OLD.sport);",
    );
    expect(migration).toContain(
      "PERFORM dojo.refresh_clan_tcdb_ranking_rt(NEW.clan_id, NEW.sport);",
    );
  });

  it("uses row triggers for ordinary writes and statement triggers only for truncate", () => {
    expect(migration).toContain(
      "CREATE TRIGGER trg_refresh_homie_tcdb_rankings_after_snapshot_row_write\nAFTER INSERT OR UPDATE OR DELETE\nON dojo.homie_tcdb_snapshot\nFOR EACH ROW",
    );
    expect(migration).toContain(
      "CREATE TRIGGER trg_refresh_homie_tcdb_rankings_after_snapshot_truncate\nAFTER TRUNCATE\nON dojo.homie_tcdb_snapshot\nFOR EACH STATEMENT",
    );
    expect(migration).toContain(
      "CREATE TRIGGER trg_refresh_clan_tcdb_rankings_after_snapshot_row_write\nAFTER INSERT OR UPDATE OR DELETE\nON dojo.clan_tcdb_snapshot\nFOR EACH ROW",
    );
    expect(migration).toContain(
      "CREATE TRIGGER trg_refresh_clan_tcdb_rankings_after_snapshot_truncate\nAFTER TRUNCATE\nON dojo.clan_tcdb_snapshot\nFOR EACH STATEMENT",
    );
  });

  it("keeps the checked-in schema snapshot aligned with the new trigger shape", () => {
    const homieTable = readFileSync(
      "db/schema/tables/homie_tcdb_snapshot.sql",
      "utf8",
    );
    const clanTable = readFileSync(
      "db/schema/tables/clan_tcdb_snapshot.sql",
      "utf8",
    );
    const homieTriggerFunction = readFileSync(
      "db/schema/functions/refresh_homie_tcdb_rankings_after_snapshot_write.sql",
      "utf8",
    );
    const clanTriggerFunction = readFileSync(
      "db/schema/functions/refresh_clan_tcdb_rankings_after_snapshot_write.sql",
      "utf8",
    );

    expect(homieTable).toContain(
      "trg_refresh_homie_tcdb_rankings_after_snapshot_row_write",
    );
    expect(homieTable).toContain(
      "trg_refresh_homie_tcdb_rankings_after_snapshot_truncate",
    );
    expect(homieTable).not.toContain(
      "AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE",
    );
    expect(clanTable).toContain(
      "trg_refresh_clan_tcdb_rankings_after_snapshot_row_write",
    );
    expect(clanTable).toContain(
      "trg_refresh_clan_tcdb_rankings_after_snapshot_truncate",
    );
    expect(clanTable).not.toContain(
      "AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE",
    );
    expect(homieTriggerFunction).toContain(
      "PERFORM dojo.refresh_homie_tcdb_ranking_rt(NEW.homie_id);",
    );
    expect(clanTriggerFunction).toContain(
      "PERFORM dojo.refresh_clan_tcdb_ranking_rt(NEW.clan_id, NEW.sport);",
    );
  });

  it("documents the refresh flow and verification query", () => {
    const strategy = readFileSync("docs/tcdb-refresh-strategy.md", "utf8");
    const verification = readFileSync(
      "docs/tcdb_ranking_rt_verification.sql",
      "utf8",
    );

    expect(strategy).toContain("Write To Read Flow");
    expect(strategy).toContain(
      "The refresh still happens inside the write transaction.",
    );
    expect(strategy).toContain("Next Improvement");
    expect(verification).toContain("raw_snapshot_rows");
    expect(verification).toContain("pg_get_triggerdef");
    expect(verification).toContain("FULL JOIN dojo.homie_tcdb_ranking_rt");
    expect(verification).toContain("FULL JOIN dojo.clan_tcdb_ranking_rt");
  });
});
