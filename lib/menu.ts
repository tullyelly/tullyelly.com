import "server-only";

import { sql } from "@/lib/db";
import {
  isCapabilityKeyArray,
  type Badge,
  type CapabilityKey,
  type NavItem,
  type Persona,
  type PersonaItem,
  type GroupItem,
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
  requires?: CapabilityKey[];
  featured?: true;
  segmentLabel?: string;
  keywords?: string[];
};

type RawMeta = {
  badge?: unknown;
  hotkey?: unknown;
  requires?: unknown;
  featured?: unknown;
  segmentLabel?: unknown;
  keywords?: unknown;
};

function normalizeCapabilityList(value: unknown): CapabilityKey[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: CapabilityKey[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const normalized = entry.trim();
    if (!normalized) continue;
    result.push(normalized);
  }
  return result.length ? result : undefined;
}

function extractMeta(meta: MenuRow["meta"]): MetaPayload {
  if (!meta || typeof meta !== "object") return {};
  const payload = meta as RawMeta;
  const parsed: MetaPayload = {};

  const badge = payload.badge as Badge | undefined;
  if (badge && typeof badge.text === "string") {
    parsed.badge = badge;
  }

  const hotkey = payload.hotkey;
  if (typeof hotkey === "string" && hotkey.trim().length > 0) {
    parsed.hotkey = hotkey.trim();
  }

  const requires = normalizeCapabilityList(payload.requires);
  if (isCapabilityKeyArray(requires)) {
    parsed.requires = requires;
  }

  if (payload.featured === true) {
    parsed.featured = true;
  }

  const segmentLabel = payload.segmentLabel;
  if (typeof segmentLabel === "string") {
    const trimmed = segmentLabel.trim();
    if (trimmed.length) {
      parsed.segmentLabel = trimmed;
    }
  }

  const keywordList = payload.keywords;
  if (Array.isArray(keywordList)) {
    const normalized = keywordList
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length);
    if (normalized.length) {
      parsed.keywords = normalized;
    }
  }

  return parsed;
}

function createNode(row: MenuRow): NavItem {
  const meta = extractMeta(row.meta);
  const requires =
    meta.requires && meta.requires.length
      ? meta.requires
      : row.feature_key
        ? [row.feature_key]
        : undefined;

  const base = {
    id: String(row.id),
    label: row.label,
    icon: row.icon ?? undefined,
    featureKey: row.feature_key ?? undefined,
    hidden: row.hidden ? true : undefined,
    requires,
    ...(meta.badge ? { badge: meta.badge } : {}),
    ...(meta.hotkey ? { hotkey: meta.hotkey } : {}),
    ...(meta.featured ? { featured: true } : {}),
    ...(meta.segmentLabel ? { segmentLabel: meta.segmentLabel } : {}),
    ...(meta.keywords ? { keywords: meta.keywords } : {}),
  };

  switch (row.kind) {
    case "persona":
      return {
        ...base,
        kind: "persona",
        persona: row.persona,
        children: [] as NavItem[],
      } satisfies PersonaItem;
    case "group":
      return {
        ...base,
        kind: "group",
        children: [] as NavItem[],
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

type LinkLike = Extract<NavItem, { kind: "link" | "external" }>;
