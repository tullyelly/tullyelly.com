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
