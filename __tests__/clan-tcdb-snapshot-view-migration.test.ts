import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/072_create_clan_tcdb_snapshot_view.sql",
  ),
  "utf8",
);

describe("clan TCDB snapshot view migration", () => {
  test("joins every clan and snapshot column with unambiguous names", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_clan_tcdb_snapshot",
    );
    expect(migration).toContain("lower(clan.name) AS clan_name_lower");
    expect(migration).toContain("snapshot.id AS snapshot_id");
    expect(migration).toContain("snapshot.clan_id AS snapshot_clan_id");
    expect(migration).toContain("ON snapshot.clan_id = clan.id");
    expect(migration).toContain("snapshot.updated_by AS snapshot_updated_by");
  });
});
