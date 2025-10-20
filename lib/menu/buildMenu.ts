import type { MenuNodeRow } from "@/lib/menu/dbTypes";
import {
  PERSONA_KEYS,
  assertPersonaKey,
  type PersonaKey,
} from "@/lib/menu/personaKeys";
import type { Badge } from "@/types/nav";

export type MenuItem = {
  id: string;
  label: string;
  href?: string;
  external?: boolean;
  iconKey?: string;
  feature?: string;
  hotkey?: string;
  badge?: Badge;
};

export type MenuSection = {
  id: string;
  title?: string;
  items: MenuItem[];
};

export type MenuPayload = {
  persona: PersonaKey;
  sections: MenuSection[];
};

export type PersonaChildren = Record<PersonaKey, MenuItem[]>;

export type FeatureGate = (feature: string) => Promise<boolean> | boolean;

export const PERSONA_ORDER: PersonaKey[] = [...PERSONA_KEYS];

async function filterRowsByAccess(
  rows: MenuNodeRow[],
  can: FeatureGate,
): Promise<MenuNodeRow[]> {
  const featureCache = new Map<string, boolean>();
  const pending = new Map<string, Promise<boolean>>();
  const allowed: MenuNodeRow[] = [];

  for (const row of rows) {
    if (!row.published || row.hidden) continue;

    const feature = row.feature_key;
    if (!feature) {
      allowed.push(row);
      continue;
    }

    let decision = featureCache.get(feature);
    if (decision === undefined) {
      let check = pending.get(feature);
      if (!check) {
        check = Promise.resolve(can(feature)).catch(() => false);
        pending.set(feature, check);
      }
      decision = await check;
      featureCache.set(feature, decision);
    }

    if (decision) {
      allowed.push(row);
    }
  }

  return allowed;
}

function sortByOrder<T extends { order_index: number; id: number }>(
  rows: T[],
): T[] {
  rows.sort((a, b) => {
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }
    return a.id - b.id;
  });
  return rows;
}

function toMenuItem(row: MenuNodeRow): MenuItem {
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  const rawBadge = meta.badge as Badge | undefined;
  const badge =
    rawBadge && typeof rawBadge?.text === "string"
      ? {
          text: rawBadge.text,
          tone: rawBadge.tone,
          type: rawBadge.type,
        }
      : undefined;
  const rawHotkey = meta.hotkey;
  const hotkey = typeof rawHotkey === "string" ? rawHotkey : undefined;

  return {
    id: row.feature_key ?? String(row.id),
    label: row.label,
    href: row.href ?? undefined,
    external: row.target === "_blank" ? true : undefined,
    iconKey: row.icon ?? undefined,
    feature: row.feature_key ?? undefined,
    hotkey,
    badge,
  };
}

function buildChildrenLookup(rows: MenuNodeRow[]): Map<number, MenuNodeRow[]> {
  const map = new Map<number, MenuNodeRow[]>();
  for (const row of rows) {
    if (row.parent_id === null) continue;
    if (!map.has(row.parent_id)) {
      map.set(row.parent_id, []);
    }
    map.get(row.parent_id)!.push(row);
  }
  for (const [, list] of map) {
    sortByOrder(list);
  }
  return map;
}

function resolveOverviewHref(
  root: MenuNodeRow,
  childRows: MenuNodeRow[],
): { href: string; external?: boolean } {
  const overview = childRows.find((child) => {
    if (!child.href) return false;
    return child.label.trim().toLowerCase() === "overview";
  });
  if (overview && overview.href) {
    return {
      href: overview.href,
      external: overview.target === "_blank" ? true : undefined,
    };
  }
  return { href: `/${root.persona}` };
}

export async function buildMenuPayload(
  rows: MenuNodeRow[],
  persona: PersonaKey,
  can: FeatureGate,
): Promise<MenuPayload> {
  assertPersonaKey(persona);
  const allowed = await filterRowsByAccess(rows, can);
  if (typeof console !== "undefined") {
    console.info("[menu build payload]", {
      total: rows.length,
      allowed: allowed.length,
      sample: allowed.slice(0, 5),
    });
  }
  for (const row of allowed) {
    assertPersonaKey(row.persona);
  }
  const personaRoots = sortByOrder(
    allowed.filter((row) => row.kind === "persona" && row.parent_id === null),
  );
  const childrenByParent = buildChildrenLookup(allowed);

  const personaItems: MenuItem[] = [];

  for (const root of personaRoots) {
    const children = childrenByParent.get(root.id) ?? [];
    const overview = resolveOverviewHref(root, children);
    personaItems.push({
      id: root.feature_key ?? String(root.id),
      label: root.label,
      href: overview.href,
      external: overview.external,
      iconKey: root.icon ?? undefined,
      feature: root.feature_key ?? undefined,
    });
  }

  return {
    persona,
    sections: [
      {
        id: "personas",
        title: "By alter ego",
        items: personaItems,
      },
    ],
  };
}

export async function buildPersonaChildren(
  rows: MenuNodeRow[],
  can: FeatureGate,
): Promise<PersonaChildren> {
  const allowed = await filterRowsByAccess(rows, can);
  if (typeof console !== "undefined") {
    console.info("[menu build children]", {
      total: rows.length,
      allowed: allowed.length,
      sample: allowed.slice(0, 5),
    });
  }
  const personaRoots = allowed.filter(
    (row) => row.kind === "persona" && row.parent_id === null,
  );
  const childrenByParent = buildChildrenLookup(allowed);

  const result = Object.fromEntries(
    PERSONA_ORDER.map((key) => [key, [] as MenuItem[]]),
  ) as PersonaChildren;

  for (const root of personaRoots) {
    const children = childrenByParent.get(root.id) ?? [];
    const items = children.map((child) => toMenuItem(child));
    result[root.persona] = items;
  }

  return result;
}
