import { readFileSync } from "node:fs";

describe("TCDb trade day migration", () => {
  const migration = readFileSync(
    "db/migrations/069_allow_tcdb_trade_sent_and_received_same_day.sql",
    "utf8",
  );

  test("scopes same-day uniqueness to the trade side", () => {
    expect(migration).toContain(
      "DROP CONSTRAINT IF EXISTS tcdb_trade_day_trade_id_date_key",
    );
    expect(migration).toContain(
      "ADD CONSTRAINT tcdb_trade_day_trade_id_date_side_key",
    );
    expect(migration).toContain("UNIQUE (trade_id, trade_date, side)");
  });
});
