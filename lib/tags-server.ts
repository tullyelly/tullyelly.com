import "server-only";

import { cache } from "react";
import { isNextBuild } from "@/lib/env";
import { sql } from "@/lib/db";
import {
  getDefaultTagHref,
  getKnownTagDisplayName,
  normalizeTagSlug,
  resolveTagHref,
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

function resolveTagMetadata(
  slug: string,
  row: TagMetadataRow | undefined,
): TagMetadata {
  if (!row) {
    return {
      slug,
      displayName: getKnownTagDisplayName(slug),
      href: getDefaultTagHref(slug),
      hrefKind: "tag",
      isClickable: true,
      meta: {},
    };
  }

  const hrefKind = normalizeHrefKind(row.href_kind);
  const isClickable = row.is_clickable !== false && hrefKind !== "none";

  return {
    slug,
    displayName: trimToValue(row.display_name) ?? getKnownTagDisplayName(slug),
    href: resolveTagHref(slug, { href: row.href, hrefKind, isClickable }),
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

  const rowsBySlug = await getTagMetadataSnapshot();

  const metadataBySlug = new Map<string, TagMetadata>();
  for (const slug of slugs) {
    metadataBySlug.set(
      slug,
      rowsBySlug.get(slug) ?? resolveTagMetadata(slug, undefined),
    );
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

/** One public metadata read per request, shared by the layout and server consumers. */
export const getTagMetadataSnapshot = cache(
  async (): Promise<Map<string, TagMetadata>> => {
    if (isNextBuild()) return new Map();
    try {
      const rows = await sql<TagMetadataRow>`
      SELECT slug, display_name, href, href_kind, is_clickable, meta
      FROM dojo.tags
    `;
      return new Map(
        rows.map((row) => {
          const slug = normalizeTagSlug(row.slug);
          return [slug, resolveTagMetadata(slug, row)];
        }),
      );
    } catch (error) {
      console.warn("[tags] Failed to resolve tag metadata", error);
      return new Map();
    }
  },
);
