import { getCapabilities } from "@/app/_auth/session";
import { fetchMenuPublished, filterByRequires } from "@/lib/menu";
import type { NavItem } from "@/types/nav";

function shouldBypassFiltering(): boolean {
  const flag = process.env.NEXT_PUBLIC_MENU_SHOW_ALL;
  if (!flag) return false;
  const normalized = flag.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function getMenuForLayout(): Promise<NavItem[]> {
  const tree = await fetchMenuPublished();
  if (shouldBypassFiltering()) {
    return tree;
  }

  const capabilities = await getCapabilities();
  const filtered = filterByRequires(tree, capabilities.has);
  return filtered;
}
