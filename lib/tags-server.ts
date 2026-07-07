import "server-only";

import { sql } from "@/lib/db";
import {
  getDefaultTagHref,
  getKnownTagDisplayName,
  getKnownTagHref,
  normalizeTagSlug,
} from "@/lib/tags";

const TAG_HREF_KINDS = [
  "tag",
  "persona",
  "squad",
  "homie",
  "clan",
  "custom",
  "external",
  "none",
] as const;

const TAG_HREF_KIND_SET = new Set<string>(TAG_HREF_KINDS);

export type TagHrefKind = (typeof TAG_HREF_KINDS)[number];

type TagMetadataRow = {
  slug: string;
  display_name: string | null;
  href: string | null;
  href_kind: string | null;
  is_clickable: boolean | null;
  meta: Record<string, unknown> | null;
};

export type TagMetadata = {
  slug: string;
  displayName: string;
  href: string | null;
  hrefKind: TagHrefKind;
  isClickable: boolean;
  meta: Record<string, unknown>;
};

function trimToValue(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeHrefKind(value: string | null | undefined): TagHrefKind {
  const normalized = trimToValue(value)?.toLowerCase();
  if (normalized && TAG_HREF_KIND_SET.has(normalized)) {
    return normalized as TagHrefKind;
  }
  return "tag";
}

function normalizeMeta(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function getFallbackHrefKind(slug: string): TagHrefKind {
  const href = getKnownTagHref(slug);
  if (href === getDefaultTagHref(slug)) return "tag";
  if (href.startsWith("/unclejimmy/squad/")) return "squad";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return "external";
  }
  if (href.startsWith("/")) return "persona";
  return "custom";
}

function getDefaultHrefForKind(slug: string, hrefKind: TagHrefKind): string {
  if (hrefKind === "homie") {
    return `/cardattack/homies/${encodeURIComponent(slug)}`;
  }
  if (hrefKind === "clan") {
    return `/cardattack/clans/${encodeURIComponent(slug)}`;
  }
  return getDefaultTagHref(slug);
}

function resolveTagMetadata(
  slug: string,
  row: TagMetadataRow | undefined,
): TagMetadata {
  if (!row) {
    return {
      slug,
      displayName: getKnownTagDisplayName(slug),
      href: getKnownTagHref(slug),
      hrefKind: getFallbackHrefKind(slug),
      isClickable: true,
      meta: {},
    };
  }

  const hrefKind = normalizeHrefKind(row.href_kind);
  const isClickable = row.is_clickable !== false && hrefKind !== "none";
  const explicitHref = trimToValue(row.href);

  return {
    slug,
    displayName: trimToValue(row.display_name) ?? getKnownTagDisplayName(slug),
    href: isClickable
      ? (explicitHref ?? getDefaultHrefForKind(slug, hrefKind))
      : null,
    hrefKind,
    isClickable,
    meta: normalizeMeta(row.meta),
  };
}

export async function getTagMetadata(tag: string): Promise<TagMetadata> {
  const slug = normalizeTagSlug(tag);
  const metadataBySlug = await getTagMetadataBatch([slug]);
  return metadataBySlug.get(slug) ?? resolveTagMetadata(slug, undefined);
}

export async function getTagMetadataBatch(
  tags: readonly string[],
): Promise<Map<string, TagMetadata>> {
  const slugs = Array.from(new Set(tags.map((tag) => normalizeTagSlug(tag))));
  if (slugs.length === 0) {
    return new Map();
  }

  const rows = await sql<TagMetadataRow>`
    SELECT
      slug,
      display_name,
      href,
      href_kind,
      is_clickable,
      meta
    FROM dojo.tags
    WHERE slug = ANY(${slugs}::text[])
  `;

  const rowsBySlug = new Map<string, TagMetadataRow>();
  for (const row of rows) {
    rowsBySlug.set(row.slug, row);
  }

  const metadataBySlug = new Map<string, TagMetadata>();
  for (const slug of slugs) {
    metadataBySlug.set(slug, resolveTagMetadata(slug, rowsBySlug.get(slug)));
  }

  return metadataBySlug;
}

export async function getStoredTagMetadata(
  tag: string,
): Promise<TagMetadata | null> {
  const slug = normalizeTagSlug(tag);
  if (!slug) return null;

  const rows = await sql<TagMetadataRow>`
    SELECT
      slug,
      display_name,
      href,
      href_kind,
      is_clickable,
      meta
    FROM dojo.tags
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const row = rows[0];
  return row ? resolveTagMetadata(slug, row) : null;
}

export async function getStoredTagMetadataForHrefKind({
  slug,
  href,
  hrefKind,
}: {
  slug?: string | null;
  href?: string | null;
  hrefKind: TagHrefKind;
}): Promise<TagMetadata | null> {
  const normalizedSlug = slug ? normalizeTagSlug(slug) : null;
  const normalizedHref = trimToValue(href) ?? null;
  if (!normalizedSlug && !normalizedHref) return null;

  const rows = await sql<TagMetadataRow>`
    SELECT
      slug,
      display_name,
      href,
      href_kind,
      is_clickable,
      meta
    FROM dojo.tags
    WHERE href_kind = ${hrefKind}
      AND (
        (${normalizedSlug}::text IS NOT NULL AND slug = ${normalizedSlug})
        OR href = ${normalizedHref}
      )
    ORDER BY
      CASE
        WHEN ${normalizedSlug}::text IS NOT NULL AND slug = ${normalizedSlug} THEN 0
        WHEN href = ${normalizedHref} THEN 1
        ELSE 2
      END
    LIMIT 1
  `;

  const row = rows[0];
  return row ? resolveTagMetadata(row.slug, row) : null;
}
