"use server";

import "server-only";

import { sql } from "@/lib/db";
import { can as canFeature } from "@/lib/authz/can";
import { getCapabilities } from "@/app/_auth/session";
import {
  buildMenuPayload,
  buildPersonaChildren,
  type FeatureGate,
} from "@/lib/menu/buildMenu";
import { createFeatureGate } from "@/lib/menu/featureGate";
import type {
  MenuPayload,
  PersonaChildren,
  PersonaKey,
} from "@/lib/menu/types";
import type { MenuNodeRow } from "@/lib/menu/dbTypes";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import type { NavItem } from "@/types/nav";
import { isNextBuild } from "@/lib/env";

type DbMenuRow = MenuNodeRow & {
  kind: MenuNodeRow["kind"] | "external" | "group";
  order_index: number;
};

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";
const BUILD_MODE = isNextBuild();
const DB_DISABLED = process.env.SKIP_DB === "true";

async function buildGate(): Promise<FeatureGate> {
  if (BUILD_MODE || DB_DISABLED) {
    const emptyCapabilities = { has: () => false };
    return createFeatureGate(emptyCapabilities, () => false);
  }
  const capabilities = await getCapabilities();
  return createFeatureGate(capabilities, canFeature);
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

  console.info("[menu rows]", rows.length, rows.slice(0, 5));

  return rows
    .map(normalizeRow)
    .filter((row): row is MenuNodeRow => row !== null);
}

export async function getMenuData(persona: PersonaKey): Promise<{
  menu: MenuPayload;
  children: PersonaChildren;
}> {
  const rows = await fetchMenuRows();
  console.info("[menu rows runtime]", { total: rows.length });
  const gate = await buildGate();
  const menu = await buildMenuPayload(rows, persona, gate);
  const children = await buildPersonaChildren(rows, gate);
  return { menu, children };
}
