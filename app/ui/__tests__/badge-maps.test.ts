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
  ] as Array<keyof typeof BADGE_VARIANTS>) {
    expect(BADGE_VARIANTS[k]).toBeTruthy();
  }
});

test("getBadgeClass falls back to archived", () => {
  expect(getBadgeClass("unknown" as any)).toBe(BADGE_VARIANTS.archived);
});
