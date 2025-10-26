"use server";

import "server-only";

import { unstable_cache } from "next/cache";
import crypto from "node:crypto";
import { sql } from "@/lib/db";
import { can as canFeature } from "@/lib/authz/can";
import { getCapabilities } from "@/app/_auth/session";
import {
  buildMenuPayload,
  buildPersonaChildren,
  filterRowsByAccess,
  type FeatureGate,
} from "@/lib/menu/buildMenu";
import { createFeatureGate } from "@/lib/menu/featureGate";
import { buildMenuIndex, type MenuIndex } from "@/lib/menu.index";
import type {
  MenuPayload,
  PersonaChildren,
  PersonaKey,
} from "@/lib/menu/types";
import type { MenuNodeRow } from "@/lib/menu/dbTypes";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import {
  isCapabilityKeyArray,
  type Badge,
  type CapabilityKey,
  type NavItem,
} from "@/types/nav";
import { isNextBuild } from "@/lib/env";

function capsHash(caps: Set<string>) {
  // Normalize + sort for stable ordering; JSON.stringify removes delimiter ambiguity
  const arr = [...caps].map((s) => s.normalize("NFC")).sort();
  const payload = JSON.stringify(arr);
  return crypto.createHash("sha1").update(payload).digest("hex");
}

const MENU_REVALIDATE_SECONDS = 300;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
let loggedCacheKeyParts = false;

function shouldBypassFiltering(): boolean {
  const flag = process.env.NEXT_PUBLIC_MENU_SHOW_ALL;
  if (!flag) return false;
  const normalized = flag.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function logMenuCacheKey(persona: PersonaKey, hash: string) {
  if (IS_PRODUCTION || loggedCacheKeyParts) return;
  loggedCacheKeyParts = true;
  console.debug(
    `[menu] cache persona=${persona} capsHashLength=${hash.length}`,
  );
}

type MenuIndexSerialized = {
  byPath: Array<[string, NavItem]>;
  parents: Array<[string, string | null]>;
};

type MenuIndexCacheShape = MenuIndexSerialized | MenuIndex;

function toEntryArray<K, V>(
  value: Map<K, V> | Array<[K, V]> | readonly [K, V][] | null | undefined,
): Array<[K, V]> {
  if (!value) return [];
  if (value instanceof Map) {
    return Array.from(value.entries());
  }
  if (Array.isArray(value)) {
    return value.map((entry) => entry);
  }
  return [];
}

function isMenuIndex(value: MenuIndexCacheShape): value is MenuIndex {
  return (
    value !== null &&
    typeof value === "object" &&
    value.byPath instanceof Map &&
    value.parents instanceof Map
  );
}

function serializeMenuIndex(index: MenuIndex): MenuIndexSerialized {
  return {
    byPath: toEntryArray(index.byPath),
    parents: toEntryArray(index.parents),
  };
}

function hydrateMenuIndex(serialized: MenuIndexCacheShape): MenuIndex {
  if (isMenuIndex(serialized)) {
    return serialized;
  }
  return {
    byPath: new Map(toEntryArray(serialized?.byPath)),
    parents: new Map(toEntryArray(serialized?.parents)),
  };
}

type DbMenuRow = MenuNodeRow & {
  kind: MenuNodeRow["kind"] | "external" | "group";
  order_index: number;
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

function extractMeta(meta: MenuNodeRow["meta"]): MetaPayload {
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

function resolveRequirements(
  row: MenuNodeRow,
  meta: MetaPayload,
): CapabilityKey[] | undefined {
  if (isCapabilityKeyArray(meta.requires)) {
    return meta.requires;
  }
  if (
    typeof row.feature_key === "string" &&
    row.feature_key.trim().length > 0
  ) {
    return [row.feature_key.trim()];
  }
  return undefined;
}

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";
const BUILD_MODE = isNextBuild();
const DB_DISABLED = process.env.SKIP_DB === "true";

const ALLOW_ALL_GATE: FeatureGate = () => true;

async function buildGate(caps?: Set<string>): Promise<FeatureGate> {
  if (BUILD_MODE || DB_DISABLED) {
    const emptyCapabilities = { has: () => false };
    return createFeatureGate(emptyCapabilities, () => false);
  }
  if (caps) {
    const normalizedCaps = new Set<string>();
    for (const value of caps) {
      const trimmed = typeof value === "string" ? value.trim() : "";
      if (trimmed) {
        normalizedCaps.add(trimmed);
      }
    }
    const snapshot = {
      has(key: string) {
        const normalized = typeof key === "string" ? key.trim() : "";
        if (!normalized) return false;
        return normalizedCaps.has(normalized);
      },
    };
    return createFeatureGate(snapshot, canFeature);
  }
  const capabilities = await getCapabilities();
  return createFeatureGate(capabilities, canFeature);
}

async function resolveGate(caps?: Set<string>): Promise<FeatureGate> {
  if (shouldBypassFiltering()) {
    return ALLOW_ALL_GATE;
  }
  return buildGate(caps);
}

function normalizeRow(row: DbMenuRow): MenuNodeRow | null {
  if (
    row.kind !== "persona" &&
    row.kind !== "link" &&
    row.kind !== "external"
  ) {
    return null;
  }
  return {
    id: row.id,
    parent_id: row.parent_id,
    persona: row.persona,
    kind: row.kind === "persona" ? "persona" : "link",
    label: row.label,
    href: row.href,
    target: row.target,
    icon: row.icon,
    order_index: row.order_index,
    feature_key: row.feature_key,
    hidden: row.hidden,
    meta: row.meta,
    published: row.published,
  };
}

function flattenTestTree(items: NavItem[]): MenuNodeRow[] {
  const rows: MenuNodeRow[] = [];
  let nextId = 1;

  for (const item of items) {
    if (!item || item.kind !== "persona") continue;
    const personaId = nextId++;
    rows.push({
      id: personaId,
      parent_id: null,
      persona: item.persona,
      kind: "persona",
      label: item.label,
      href: null,
      target: null,
      icon: item.icon ?? null,
      order_index: rows.length,
      feature_key: item.featureKey ?? null,
      hidden: Boolean(item.hidden),
      meta: null,
      published: true,
    });

    const children = Array.isArray(item.children) ? item.children : [];
    children.forEach((child, index) => {
      if (!child || (child.kind !== "link" && child.kind !== "external")) {
        return;
      }
      rows.push({
        id: nextId++,
        parent_id: personaId,
        persona: item.persona,
        kind: "link",
        label: child.label,
        href: child.href ?? null,
        target: child.kind === "external" ? (child.target ?? "_blank") : null,
        icon: child.icon ?? null,
        order_index: index,
        feature_key: child.featureKey ?? null,
        hidden: Boolean(child.hidden),
        meta: null,
        published: true,
      });
    });
  }

  return rows;
}

async function fetchMenuRows(): Promise<MenuNodeRow[]> {
  if (TEST_MODE || BUILD_MODE || DB_DISABLED) {
    return flattenTestTree(TEST_MENU_ITEMS);
  }

  const rows = await sql<DbMenuRow>`
    SELECT
      id,
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
      meta,
      published
    FROM dojo.v_menu_published
  `;

  return rows
    .map(normalizeRow)
    .filter((row): row is MenuNodeRow => row !== null);
}

function compareRowOrder(a: MenuNodeRow, b: MenuNodeRow): number {
  if (a.order_index !== b.order_index) {
    return a.order_index - b.order_index;
  }
  return a.id - b.id;
}

function buildChildrenLookup(
  rows: MenuNodeRow[],
): Map<number | null, MenuNodeRow[]> {
  const lookup = new Map<number | null, MenuNodeRow[]>();
  for (const row of rows) {
    const parent = row.parent_id;
    if (!lookup.has(parent)) {
      lookup.set(parent, []);
    }
    lookup.get(parent)!.push(row);
  }
  for (const list of lookup.values()) {
    list.sort(compareRowOrder);
  }
  return lookup;
}

function toNavItem(
  row: MenuNodeRow,
  lookup: Map<number | null, MenuNodeRow[]>,
): NavItem {
  const meta = extractMeta(row.meta);
  const requires = resolveRequirements(row, meta);
  const base = {
    id: String(row.id),
    label: row.label,
    icon: row.icon ?? undefined,
    badge: meta.badge,
    hotkey: meta.hotkey,
    featureKey: row.feature_key ?? undefined,
    requires,
    hidden: row.hidden ? true : undefined,
    featured: meta.featured,
    segmentLabel: meta.segmentLabel,
    keywords: meta.keywords,
  };
  const childrenRows = lookup.get(row.id) ?? [];
  const children = childrenRows.map((child) => toNavItem(child, lookup));

  if (row.kind === "persona") {
    return {
      ...base,
      kind: "persona",
      persona: row.persona,
      children: children.length ? children : undefined,
    };
  }

  if (!row.href) {
    throw new Error(`Menu node missing href for id=${row.id}`);
  }

  if (row.target === "_blank") {
    return {
      ...base,
      kind: "external",
      href: row.href,
      target: "_blank",
    };
  }

  return {
    ...base,
    kind: "link",
    href: row.href,
  };
}

function buildNavTree(rows: MenuNodeRow[]): NavItem[] {
  const lookup = buildChildrenLookup(rows);
  const roots = lookup.get(null) ?? [];
  return roots.map((row) => toNavItem(row, lookup));
}

export async function getMenuData(
  persona: PersonaKey,
  caps?: Set<string>,
): Promise<{
  menu: MenuPayload;
  children: PersonaChildren;
}> {
  const rows = await fetchMenuRows();
  const gate = await resolveGate(caps);
  const menu = await buildMenuPayload(rows, persona, gate);
  const children = await buildPersonaChildren(rows, gate);
  return { menu, children };
}

export async function getMenuDataCached(
  persona: PersonaKey,
  caps: Set<string>,
) {
  const bypass = shouldBypassFiltering();
  const hash = bypass ? "bypass" : capsHash(caps);
  logMenuCacheKey(persona, hash);
  const key = ["menu", persona, hash];
  const cached = unstable_cache(async () => getMenuData(persona, caps), key, {
    tags: ["menu", `menu:${persona}`],
    revalidate: MENU_REVALIDATE_SECONDS,
  });
  return cached();
}

async function loadMenuWithCaps(
  caps: Set<string>,
): Promise<{ tree: NavItem[]; index: MenuIndexSerialized }> {
  const rows = await fetchMenuRows();
  const gate = await resolveGate(caps);
  const allowed = await filterRowsByAccess(rows, gate);
  const tree = buildNavTree(allowed);
  const index = buildMenuIndex(tree);
  return { tree, index: serializeMenuIndex(index) };
}

export async function getMenu(): Promise<{
  tree: NavItem[];
  index: MenuIndex;
}> {
  const bypass = shouldBypassFiltering();
  const shouldQueryCapabilities = !bypass && !BUILD_MODE && !DB_DISABLED;
  const capabilities = shouldQueryCapabilities ? await getCapabilities() : null;
  const caps = capabilities?.all ?? new Set<string>();
  const hash = bypass ? "bypass" : capsHash(caps);
  const key = ["menu", "tree", hash];
  const cached = unstable_cache(() => loadMenuWithCaps(caps), key, {
    tags: ["menu", "menu:tree"],
    revalidate: MENU_REVALIDATE_SECONDS,
  });
  const payload = await cached();
  return {
    tree: payload.tree,
    index: hydrateMenuIndex(payload.index),
  };
}

export async function getMenuForLayout(): Promise<NavItem[]> {
  const { tree } = await getMenu();
  return tree;
}
