import "server-only";

import { sql } from "@/lib/db";

const SQUAD_PAGE_ITEM_KINDS = [
  "person",
  "team",
  "link",
  "placeholder",
] as const;

const SQUAD_PAGE_ITEM_KIND_SET = new Set<string>(SQUAD_PAGE_ITEM_KINDS);

export type SquadPageItemKind = (typeof SQUAD_PAGE_ITEM_KINDS)[number];

export type SquadPageContentRow = {
  section_key: string | null;
  section_title: string | null;
  section_description: string | null;
  section_display_order: number | string | null;
  item_slug: string | null;
  item_label: string | null;
  item_blurb: string | null;
  item_href: string | null;
  item_kind: string | null;
  item_display_order: number | string | null;
  item_meta: Record<string, unknown> | null;
};

export type SquadPageItem = {
  sectionKey: string;
  slug: string;
  label: string;
  blurb?: string;
  href?: string;
  kind: SquadPageItemKind;
  displayOrder: number;
  meta: Record<string, unknown>;
};

export type SquadPageSection = {
  sectionKey: string;
  title: string;
  description?: string;
  displayOrder: number;
  items: SquadPageItem[];
};

function trimToValue(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeKey(value: string | null | undefined): string | undefined {
  return trimToValue(value)?.toLowerCase();
}

function toDisplayOrder(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeItemKind(
  value: string | null | undefined,
): SquadPageItemKind {
  const normalized = trimToValue(value)?.toLowerCase();
  if (normalized && SQUAD_PAGE_ITEM_KIND_SET.has(normalized)) {
    return normalized as SquadPageItemKind;
  }
  return "link";
}

function normalizeMeta(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

export function groupSquadPageContentRows(
  rows: SquadPageContentRow[],
): SquadPageSection[] {
  const sectionMap = new Map<string, SquadPageSection>();

  for (const row of rows) {
    const sectionKey = normalizeKey(row.section_key);
    if (!sectionKey) continue;

    const sectionTitle = trimToValue(row.section_title) ?? sectionKey;
    let section = sectionMap.get(sectionKey);

    if (!section) {
      section = {
        sectionKey,
        title: sectionTitle,
        description: trimToValue(row.section_description),
        displayOrder: toDisplayOrder(row.section_display_order),
        items: [],
      };
      sectionMap.set(sectionKey, section);
    }

    const itemSlug = normalizeKey(row.item_slug);
    const itemLabel = trimToValue(row.item_label);
    if (!itemSlug || !itemLabel) continue;

    section.items.push({
      sectionKey,
      slug: itemSlug,
      label: itemLabel,
      blurb: trimToValue(row.item_blurb),
      href: trimToValue(row.item_href),
      kind: normalizeItemKind(row.item_kind),
      displayOrder: toDisplayOrder(row.item_display_order),
      meta: normalizeMeta(row.item_meta),
    });
  }

  const sections = Array.from(sectionMap.values());
  sections.sort(
    (left, right) =>
      left.displayOrder - right.displayOrder ||
      left.sectionKey.localeCompare(right.sectionKey),
  );

  for (const section of sections) {
    section.items.sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.slug.localeCompare(right.slug),
    );
  }

  return sections;
}

export function getSquadPageItemHref(
  item: Pick<SquadPageItem, "href" | "kind" | "slug">,
): string | null {
  const explicitHref = trimToValue(item.href);
  if (explicitHref) {
    return explicitHref;
  }

  if (item.kind === "person" || item.kind === "team") {
    return `/unclejimmy/squad/${encodeURIComponent(item.slug)}`;
  }

  return null;
}

export async function getSquadPageContent(): Promise<SquadPageSection[]> {
  const rows = await sql<SquadPageContentRow>`
    SELECT
      section_key,
      section_title,
      section_description,
      section_display_order,
      item_slug,
      item_label,
      item_blurb,
      item_href,
      item_kind,
      item_display_order,
      item_meta
    FROM dojo.v_unclejimmy_squad_page_content
    ORDER BY
      section_display_order,
      section_key,
      item_display_order NULLS LAST,
      item_slug
  `;

  return groupSquadPageContentRows(rows);
}
