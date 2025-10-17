import "server-only";

import { getMenuForLayout } from "@/app/_menu/getMenu";
import type { NavItem } from "@/types/nav";

export type MenuNode = {
  id: string;
  label: string;
  href?: string;
  children?: MenuNode[];
  resolveLabel?: (pathname: string) => string;
};

function normalizeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  if (!href.startsWith("/")) return null;
  const trimmed = href.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

function getNodeLabel(item: NavItem): string {
  const candidate = (item as NavItem & { segmentLabel?: string }).segmentLabel;
  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (trimmed.length) return trimmed;
  }
  return item.label;
}

function extractChildren(node: NavItem): NavItem[] | undefined {
  if ("children" in node && Array.isArray(node.children)) {
    return node.children;
  }
  return undefined;
}

function mergeByHref(nodes: MenuNode[]): MenuNode[] {
  const seen = new Map<string, MenuNode>();
  const merged: MenuNode[] = [];

  const add = (node: MenuNode) => {
    const key = normalizeHref(node.href) ?? node.id;
    const existing = seen.get(key);
    if (existing) {
      const incomingChildren = node.children ?? [];
      const existingChildren = existing.children ?? [];
      if (incomingChildren.length || existingChildren.length) {
        const combined = mergeByHref([
          ...existingChildren,
          ...incomingChildren,
        ]);
        existing.children = combined.length ? combined : undefined;
      }
      return;
    }
    const cloned: MenuNode = {
      ...node,
      children: node.children ? mergeByHref(node.children) : undefined,
    };
    seen.set(key, cloned);
    merged.push(cloned);
  };

  nodes.forEach(add);
  return merged;
}

function createMenuNodes(items: NavItem[] | undefined): MenuNode[] {
  if (!items) return [];
  const nodes: MenuNode[] = [];

  for (const item of items) {
    if (!item || item.hidden) continue;

    switch (item.kind) {
      case "link": {
        const children = createMenuNodes(extractChildren(item));
        nodes.push({
          id: item.id,
          label: getNodeLabel(item),
          href: item.href,
          children: children.length ? children : undefined,
        });
        break;
      }
      case "persona":
      case "group": {
        const children = createMenuNodes(extractChildren(item));
        if (children.length) {
          nodes.push(...children);
        }
        break;
      }
      default:
        // External links are not part of the breadcrumb trail.
        break;
    }
  }

  return nodes;
}

export function buildMenuTree(navItems: NavItem[]): MenuNode[] {
  const nodes = createMenuNodes(navItems);
  if (!nodes.length) {
    return [
      {
        id: "__root__",
        label: "Home",
        href: "/",
      },
    ];
  }

  const rootCandidate = nodes.find((node) => normalizeHref(node.href) === "/");
  const rootLabel = rootCandidate?.label ?? "Home";
  const rootChildren = mergeByHref([
    ...(rootCandidate?.children ?? []),
    ...nodes.filter((node) => normalizeHref(node.href) !== "/"),
  ]);

  return [
    {
      id: rootCandidate?.id ?? "__root__",
      label: rootLabel,
      href: "/",
      children: rootChildren.length ? rootChildren : undefined,
    },
  ];
}

export async function getMenuTree(): Promise<MenuNode[]> {
  const navItems = await getMenuForLayout();
  return buildMenuTree(navItems);
}
