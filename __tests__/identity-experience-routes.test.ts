import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = readFileSync(
  path.join(root, "db/migrations/071_add_identity_experience_routes.sql"),
  "utf8",
);
const nextConfig = readFileSync(path.join(root, "next.config.mjs"), "utf8");
const fallback = readFileSync(path.join(root, "lib/menu/fallback.ts"), "utf8");

describe("identity experience routes", () => {
  test.each([
    "theabbott/crates",
    "theabbott/homies",
    "theabbott/clans",
    "unclejimmy/fam",
    "unclejimmy/squads",
  ])("defines /%s", (route) => {
    expect(() =>
      readFileSync(path.join(root, `app/${route}/page.tsx`)),
    ).not.toThrow();
  });

  test("redirects known legacy Fam profiles without redirecting volleyball", () => {
    expect(nextConfig).toContain("/unclejimmy/squad/${slug}");
    expect(nextConfig).toContain("/unclejimmy/fam/${slug}");
    expect(nextConfig).not.toContain('source: "/unclejimmy/squad/:');
  });

  test("reconciles menu rows by feature or href and aligns fallback routes", () => {
    expect(migration).toContain(
      "feature_key = entry.feature_key OR href = entry.href",
    );
    expect(migration).toContain("id <> v_canonical_id");
    for (const href of [
      "/theabbott/crates",
      "/theabbott/homies",
      "/theabbott/clans",
      "/unclejimmy/fam",
      "/unclejimmy/squads",
      "/cardattack/clans",
    ]) {
      expect(migration).toContain(href);
      expect(fallback).toContain(href);
    }
  });
});
