import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");
describe("reviewed Admin SQL handoff", () => {
  it("binds ledger and atomic bundle to the exact original migration bytes", () => {
    const migration = read(
      "db/migrations/095_restrict_admin_menu_requirements.sql",
    );
    const digest = createHash("sha256").update(migration).digest("hex");
    const bundle = read("db/operations/095_apply_with_ledger.sql");
    const originalBody = migration.slice(
      migration.indexOf("DO $admin$"),
      migration.indexOf("COMMIT;"),
    );
    expect(bundle).toContain(originalBody);
    for (const path of [
      "db/operations/095_record_applied.sql",
      "db/operations/095_apply_with_ledger.sql",
    ])
      expect(read(path)).toContain(digest);
    for (const path of [
      "db/migrations/095_restrict_admin_menu_requirements.sql",
      "db/operations/095_record_applied.sql",
      "db/operations/095_apply_with_ledger.sql",
      "db/operations/095_admin_menu_preflight.sql",
      "db/operations/095_admin_menu_postflight.sql",
    ])
      expect(read("docs/admin-menu-discovery.md")).toContain(
        createHash("sha256").update(read(path)).digest("hex"),
      );
  });
  it("keeps preflight/postflight strictly observational and scoped to Admin", () => {
    for (const phase of ["preflight", "postflight"]) {
      const sql = read(`db/operations/095_admin_menu_${phase}.sql`);
      expect(sql).toContain("REPEATABLE READ READ ONLY;");
      expect(sql).not.toMatch(
        /\b(?:INSERT INTO|UPDATE dojo|DELETE FROM|CREATE TABLE)\b/,
      );
      expect(sql).toContain("AS unrelated_rows");
      expect(sql).toContain("AS preserved_metadata");
    }
  });
});
