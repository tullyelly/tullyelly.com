import { cache } from "react";
import { getCapabilities } from "@/app/_auth/session";
import { fetchMenuPublished, filterByRequires } from "@/lib/menu";
import { buildMenuIndex } from "@/lib/menu.index";
import type { MenuIndex } from "@/lib/menu.index";
import type { NavItem } from "@/types/nav";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";

export interface MenuPayload {
  tree: NavItem[];
  index: MenuIndex;
}

function shouldBypassFiltering(): boolean {
  const flag = process.env.NEXT_PUBLIC_MENU_SHOW_ALL;
  if (!flag) return false;
  const normalized = flag.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const loadMenu = cache(async (): Promise<MenuPayload> => {
  const testMode =
    process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

  if (testMode) {
    const stub = TEST_MENU_ITEMS;
    const index = buildMenuIndex(stub);
    return { tree: stub, index };
  }

  const tree = await fetchMenuPublished();
  let filtered = tree;

  if (!shouldBypassFiltering()) {
    const capabilities = await getCapabilities();
    filtered = filterByRequires(tree, capabilities.has);
  }

  const index = buildMenuIndex(filtered);
  return { tree: filtered, index };
});

export async function getMenu(): Promise<MenuPayload> {
  return loadMenu();
}

export async function getMenuForLayout(): Promise<NavItem[]> {
  const { tree } = await loadMenu();
  return tree;
}
