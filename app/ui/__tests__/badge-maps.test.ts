import { BADGE_VARIANTS, getBadgeClass } from "@/app/ui/badge-maps";

test("badge variants contain expected keys", () => {
  for (const k of [
    "planned",
    "released",
    "hotfix",
    "archived",
    "minor",
    "major",
    "classic",
    "year",
  ] as Array<keyof typeof BADGE_VARIANTS>) {
    expect(BADGE_VARIANTS[k]).toBeTruthy();
  }
});

test("getBadgeClass falls back to archived", () => {
  expect(getBadgeClass("unknown" as any)).toBe(BADGE_VARIANTS.archived);
});

test("year badge uses Bucks green with white text", () => {
  const cls = getBadgeClass('year');
  expect(cls).toContain('bg-brand-bucksGreen');
  expect(cls).toContain('text-white');
});
