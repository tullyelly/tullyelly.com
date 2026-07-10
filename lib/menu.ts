import {
  isCapabilityKeyArray,
  type CapabilityKey,
  type NavItem,
} from "@/types/nav";

// Legacy compatibility module. DB-backed menu loading lives in lib/menu/getMenu.ts;
// keep this file pure so tests can exercise filtering without database access.
function hasChildren(
  node: NavItem,
): node is Extract<NavItem, { kind: "persona" | "group" }> {
  return node.kind === "persona" || node.kind === "group";
}

function resolveRequirements(item: NavItem): CapabilityKey[] {
  if (isCapabilityKeyArray(item.requires)) {
    return item.requires;
  }
  if (
    typeof item.featureKey === "string" &&
    item.featureKey.trim().length > 0
  ) {
    return [item.featureKey.trim()];
  }
  return [];
}

type CapabilityChecker = (key: CapabilityKey) => boolean;

export function filterByRequires(
  items: NavItem[],
  hasCapability: CapabilityChecker,
): NavItem[] {
  const walk = (input: NavItem[]): NavItem[] => {
    const result: NavItem[] = [];

    for (const item of input) {
      if (item.hidden) continue;

      const requirements = resolveRequirements(item);
      const accessible = requirements.every((key) => hasCapability(key));
      if (!accessible) continue;

      if (hasChildren(item) && item.children) {
        const children = walk(item.children);
        if (!children.length) continue;
        result.push({ ...item, children });
      } else {
        result.push(item);
      }
    }

    return result;
  };

  return walk(items);
}
