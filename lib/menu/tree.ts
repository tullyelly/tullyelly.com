import "server-only";

import { getMenuForLayout } from "@/app/_menu/getMenu";
import type { NavItem } from "@/types/nav";

export type MenuNode = {
  id: number;
  label: string;
  href: string | null;
  kind: "persona" | "link";
  children?: MenuNode[];
  resolveLabel?: (pathname: string) => string;
};

function toNumericId(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  }
  return hash;
}

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

function createLinkNodes(items: NavItem[] | undefined): MenuNode[] {
  if (!items) return [];
  const nodes: MenuNode[] = [];

  for (const item of items) {
    if (!item || item.hidden) continue;

    switch (item.kind) {
      case "link": {
        const children = createLinkNodes(extractChildren(item));
        nodes.push({
          id: toNumericId(item.id),
          label: getNodeLabel(item),
          href: normalizeHref(item.href),
          kind: "link",
          children: children.length ? children : undefined,
        });
        break;
      }
      case "group": {
        nodes.push(...createLinkNodes(extractChildren(item)));
        break;
      }
      default:
        break;
    }
  }

  return nodes;
}

function createMenuNodes(items: NavItem[]): MenuNode[] {
  const nodes: MenuNode[] = [];

  for (const item of items) {
    if (!item || item.hidden) continue;

    switch (item.kind) {
      case "persona": {
        const children = createLinkNodes(extractChildren(item));
        const personaHref = normalizeHref(
          (item as { href?: string | null }).href ?? null,
        );
        nodes.push({
          id: toNumericId(item.id),
          label: getNodeLabel(item),
          href: personaHref,
          kind: "persona",
          children: children.length ? children : undefined,
        });
        break;
      }
      case "link": {
        const children = createLinkNodes(extractChildren(item));
        nodes.push({
          id: toNumericId(item.id),
          label: getNodeLabel(item),
          href: normalizeHref(item.href),
          kind: "link",
          children: children.length ? children : undefined,
        });
        break;
      }
      case "group": {
        nodes.push(...createMenuNodes(extractChildren(item) ?? []));
        break;
      }
      default:
        break;
    }
  }

  return nodes;
}

export function buildMenuTree(navItems: NavItem[]): MenuNode[] {
  return createMenuNodes(navItems);
}

export async function getMenuTree(): Promise<MenuNode[]> {
  const navItems = await getMenuForLayout();
  return buildMenuTree(navItems);
}
