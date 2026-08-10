import { readFileSync } from "node:fs";
import path from "node:path";

const sql = readFileSync(
  path.join(
    process.cwd(),
    "db/migrations/068_create_shaolin_release_activity_views.sql",
  ),
  "utf8",
);

describe("Shaolin release activity views", () => {
  it("uses prior release plus one day and an inclusive end", () => {
    expect(sql).toContain("bounds.previous_release_date + 1");
    expect(sql).toContain("COALESCE(bounds.release_date::date, CURRENT_DATE)");
    expect(sql).toContain(
      "BETWEEN release_window.activity_start_date AND release_window.activity_end_date",
    );
  });

  it("derives the first window from meaningful activity", () => {
    expect(sql).toContain(
      "SELECT MIN(activity.activity_date) AS activity_date",
    );
    expect(sql).toContain("earliest.activity_date");
    expect(sql).toContain(
      "activity.activity_date <= COALESCE(bounds.release_date::date, CURRENT_DATE)",
    );
  });

  it("normalizes the supported dated domains and excludes audit timestamps", () => {
    for (const domain of [
      "tcdb_trade",
      "lcs_visit",
      "usps_visit",
      "review",
      "bricks_build",
      "set_collector",
    ]) {
      expect(sql).toContain(`'${domain}'`);
    }
    expect(sql).not.toMatch(/created_at\s+AS activity_date/i);
    expect(sql).not.toMatch(/updated_at\s+AS activity_date/i);
  });

  it("reads aggregate trade counts from the trade header", () => {
    expect(sql).toContain(
      "CASE WHEN day.side = 'sent' THEN trade.sent ELSE trade.received END",
    );
    expect(sql).not.toMatch(/day\.(?:sent|received)/);
  });

  it("does not use PostgreSQL WINDOW as a relation alias", () => {
    expect(sql).not.toMatch(/\bwindow\./i);
    expect(sql).toContain("FROM dojo.v_shaolin_release_window release_window");
  });
});
