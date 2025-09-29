import { fetchMenuPublished, filterByRequires } from "@/lib/menu";
import type { NavItem } from "@/types/nav";

// TODO(WU-374): replace can() with real effective-features check
function can(featureKey?: string): boolean {
  // Single-require: if no feature is specified, allow; else check user's features.
  // TEMP: allow all until WU-374 lands.
  return true;
}

export async function getMenuForLayout(): Promise<NavItem[]> {
  const tree = await fetchMenuPublished();
  // Optional: sort children consistently (DB already orders via order_index; keep as-is)
  const filtered = filterByRequires(tree, can);
  return filtered;
}
