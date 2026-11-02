import type { MenuNodeRow } from "@/lib/menu/dbTypes";

/** Explicit normalized requirements override the attribution feature key. */
export function resolveMenuRequirements(
  row: Pick<MenuNodeRow, "meta" | "feature_key">,
): string[] {
  const raw = row.meta?.requires;
  if (Array.isArray(raw)) {
    const requirements = raw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    if (requirements.length) return requirements;
  }
  const feature = row.feature_key?.trim();
  return feature ? [feature] : [];
}
