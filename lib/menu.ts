import "server-only";

import { sql } from "@/lib/db";
import type {
  Badge,
  NavItem,
  Persona,
  PersonaItem,
  GroupItem,
} from "@/types/nav";

type MenuKind = "persona" | "link" | "external" | "group";

type MenuRow = {
  id: number;
  parent_id: number | null;
  persona: Persona;
  kind: MenuKind;
  label: string;
  href: string | null;
  target: "_self" | "_blank" | null;
  icon: string | null;
  order_index: number;
  feature_key: string | null;
  hidden: boolean;
  meta: Record<string, unknown> | null;
};

type MetaPayload = {
  badge?: Badge;
  hotkey?: string;
};

function extractMeta(meta: MenuRow["meta"]): MetaPayload {
  if (!meta || typeof meta !== "object") return {};
  const payload = meta as MetaPayload;
  const parsed: MetaPayload = {};

  if (payload.badge && typeof payload.badge.text === "string") {
    parsed.badge = payload.badge;
  }

  if (payload.hotkey && typeof payload.hotkey === "string") {
    parsed.hotkey = payload.hotkey;
  }

  return parsed;
}

function createNode(row: MenuRow): NavItem {
  const meta = extractMeta(row.meta);
  const base = {
    id: String(row.id),
    label: row.label,
    icon: row.icon ?? undefined,
    featureKey: row.feature_key ?? undefined,
    hidden: row.hidden || undefined,
    ...(meta.badge ? { badge: meta.badge } : {}),
    ...(meta.hotkey ? { hotkey: meta.hotkey } : {}),
  } as const;

  switch (row.kind) {
    case "persona":
      return {
        ...base,
        kind: "persona",
        persona: row.persona,
        children: [],
      } satisfies PersonaItem;
    case "group":
      return {
        ...base,
        kind: "group",
        children: [],
      } satisfies GroupItem;
    case "external":
      if (!row.href) throw new Error("External menu node missing href");
      return {
        ...base,
        kind: "external",
        href: row.href,
        target: row.target ?? undefined,
      };
    case "link":
    default:
      if (!row.href) throw new Error("Link menu node missing href");
      return {
        ...base,
        kind: "link",
        href: row.href,
      };
  }
}

function hasChildren(node: NavItem): node is PersonaItem | GroupItem {
  return node.kind === "persona" || node.kind === "group";
}

export async function fetchMenuPublished(): Promise<NavItem[]> {
  const rows = await sql<MenuRow>`
    SELECT id,
           parent_id,
           persona,
           kind,
           label,
           href,
           target,
           icon,
           order_index,
           feature_key,
           hidden,
           meta
    FROM dojo.v_menu_published
  `;

  const nodes = new Map<number, NavItem>();

  for (const row of rows) {
    nodes.set(row.id, createNode(row));
  }

  const roots: NavItem[] = [];

  for (const row of rows) {
    const node = nodes.get(row.id);
    if (!node) continue;

    if (row.parent_id !== null) {
      const parent = nodes.get(row.parent_id);
      if (parent && hasChildren(parent)) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}

type LinkLike = Extract<NavItem, { kind: "link" | "external" }>;

export function filterByRequires(
  items: NavItem[],
  can: (featureKey?: string) => boolean,
): NavItem[] {
  const walk = (input: NavItem[]): NavItem[] => {
    const result: NavItem[] = [];

    for (const item of input) {
      const hasAccess = !item.featureKey || can(item.featureKey);
      if (!hasAccess) continue;

      if (hasChildren(item) && item.children) {
        const children = walk(item.children);
        result.push({ ...item, children });
      } else {
        result.push(item);
      }
    }

    return result;
  };

  return walk(items);
}

export function flattenLinks(items: NavItem[]): LinkLike[] {
  const collected: LinkLike[] = [];

  const walk = (input: NavItem[]): void => {
    for (const item of input) {
      if (item.hidden) continue;

      if (item.kind === "link" || item.kind === "external") {
        collected.push(item);
      }

      if (hasChildren(item) && item.children) {
        walk(item.children);
      }
    }
  };

  walk(items);
  return collected;
}
