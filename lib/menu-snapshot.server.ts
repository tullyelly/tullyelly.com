import "server-only";

import type { NavItem } from "@/types/nav";

export type MenuNode = {
  id: string;
  label: string;
  href?: string;
  gated?: boolean;
  children?: MenuNode[];
};

function createNode(item: NavItem): MenuNode | null {
  switch (item.kind) {
    case "link":
    case "external":
      return {
        id: item.id,
        label: item.label,
        href: item.href,
        gated: item.hidden ? true : undefined,
      };
    case "group": {
      const children = item.children
        .map(createNode)
        .filter((child): child is MenuNode => child !== null);
      return {
        id: item.id,
        label: item.label || "",
        gated: item.hidden ? true : undefined,
        children: children.length ? children : undefined,
      };
    }
    case "persona": {
      const children = (item.children ?? [])
        .map(createNode)
        .filter((child): child is MenuNode => child !== null);
      return {
        id: item.id,
        label: item.label,
        gated: item.hidden ? true : undefined,
        children: children.length ? children : undefined,
      };
    }
    default:
      return null;
  }
}

export function getMenuSnapshot(navItems: NavItem[]): MenuNode {
  const children =
    navItems
      .map(createNode)
      .filter((child): child is MenuNode => child !== null) ?? [];

  return {
    id: "__root__",
    label: "home",
    href: "/",
    children,
  };
}
