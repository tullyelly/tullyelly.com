import { BADGE_VARIANTS, getBadgeClass } from "@/app/ui/badge-maps";

test("badge variants contain expected keys", () => {
  for (const k of [
    "planned",
    "released",
    "hotfix",
    "archived",
    "minor",
    "major",
    "chore",
    "tcdb",
    "classic",
    "year",
  ] as Array<keyof typeof BADGE_VARIANTS>) {
    expect(BADGE_VARIANTS[k]).toBeTruthy();
  }
});

test("getBadgeClass falls back to archived", () => {
  expect(getBadgeClass("unknown" as any)).toBe(BADGE_VARIANTS.archived);
});

test("year badge uses Bucks green with Cream City Cream text", () => {
  const cls = getBadgeClass("year");
  expect(cls).toContain("bg-brand-bucksGreen");
  expect(cls).toContain("text-brand-creamCityCream");
});

test("chore badge uses Bucks purple with white text", () => {
  const cls = getBadgeClass("chore");
  expect(cls).toContain("bg-[#702F8A]");
  expect(cls).toContain("text-white");
  expect(cls).toContain("ring-[#702F8A]/40");
});

test("tcdb badge uses burnt orange with off-white text", () => {
  const cls = getBadgeClass("tcdb");
  expect(cls).toContain("bg-[#B65A36]");
  expect(cls).toContain("text-[#F2E5D6]");
  expect(cls).toContain("ring-[#B65A36]/40");
});
