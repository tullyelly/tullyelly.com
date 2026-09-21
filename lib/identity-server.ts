import "server-only";

import { sql } from "@/lib/db";
import {
  readIdentityMetadata,
  resolveIdentityHref,
  type IdentityContext,
  type IdentityMetadata,
} from "@/lib/identity";
import { normalizeTagSlug } from "@/lib/tags";

type IdentityRow = {
  id: number;
  slug: string;
  name: string;
  display_name: string | null;
  href: string | null;
  meta: Record<string, unknown> | null;
};

type RelationRow = {
  id: string | number;
  relation_type: string;
  meta: Record<string, unknown> | null;
  source_id: number;
  source_slug: string;
  source_name: string;
  source_display_name: string | null;
  source_href: string | null;
  source_meta: Record<string, unknown> | null;
  target_id: number;
  target_slug: string;
  target_name: string;
  target_display_name: string | null;
  target_href: string | null;
  target_meta: Record<string, unknown> | null;
};

export type Identity = {
  id: number;
  slug: string;
  displayName: string;
  href: string | null;
  metadata: IdentityMetadata;
  meta: Record<string, unknown>;
};

export type IdentityRelation = {
  id: string;
  type: string;
  meta: Record<string, unknown>;
  source: Identity;
  target: Identity;
};

export async function listIdentities({
  context,
  kind,
}: {
  context: IdentityContext;
  kind?: "person" | "group";
}): Promise<Identity[]> {
  const rows = await sql<IdentityRow>`
    SELECT id, slug, name, display_name, href, meta
    FROM dojo.tags
    WHERE meta->'identity'->'contexts' ? ${context}
      AND (${kind ?? null}::text IS NULL OR meta->'identity'->>'kind' = ${kind ?? null})
    ORDER BY COALESCE(display_name, name), slug
  `;
  return rows.map(identityFromRow);
}

function identityFromRow(row: IdentityRow): Identity {
  const meta = row.meta ?? {};
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name?.trim() || row.name,
    href: row.href,
    metadata: readIdentityMetadata(meta),
    meta,
  };
}

function relationFromRow(row: RelationRow): IdentityRelation {
  return {
    id: String(row.id),
    type: row.relation_type,
    meta: row.meta ?? {},
    source: identityFromRow({
      id: row.source_id,
      slug: row.source_slug,
      name: row.source_name,
      display_name: row.source_display_name,
      href: row.source_href,
      meta: row.source_meta,
    }),
    target: identityFromRow({
      id: row.target_id,
      slug: row.target_slug,
      name: row.target_name,
      display_name: row.target_display_name,
      href: row.target_href,
      meta: row.target_meta,
    }),
  };
}

export async function getIdentityBySlug(
  slug: string,
): Promise<Identity | null> {
  const normalized = normalizeTagSlug(slug);
  const rows = await sql<IdentityRow>`
    SELECT id, slug, name, display_name, href, meta
    FROM dojo.tags
    WHERE slug = ${normalized}
    LIMIT 1
  `;
  return rows[0] ? identityFromRow(rows[0]) : null;
}

export function getIdentityHref(
  identity: Identity,
  context: IdentityContext,
): string | null {
  return resolveIdentityHref(identity.meta, context, identity.href);
}

async function listRelations(
  slug: string,
  direction: "outgoing" | "incoming",
  relationType?: string,
): Promise<IdentityRelation[]> {
  const normalized = normalizeTagSlug(slug);
  const type = relationType?.trim() || null;
  const selectRelations =
    direction === "outgoing"
      ? sql<RelationRow>`
    SELECT
      relation.id,
      relation.relation_type,
      relation.meta,
      source.id AS source_id,
      source.slug AS source_slug,
      source.name AS source_name,
      source.display_name AS source_display_name,
      source.href AS source_href,
      source.meta AS source_meta,
      target.id AS target_id,
      target.slug AS target_slug,
      target.name AS target_name,
      target.display_name AS target_display_name,
      target.href AS target_href,
      target.meta AS target_meta
    FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS source ON source.id = relation.source_tag_id
    JOIN dojo.tags AS target ON target.id = relation.target_tag_id
    WHERE source.slug = ${normalized}
      AND (${type}::text IS NULL OR relation.relation_type = ${type})
    ORDER BY relation.relation_type, source.slug, target.slug
  `
      : sql<RelationRow>`
    SELECT
      relation.id,
      relation.relation_type,
      relation.meta,
      source.id AS source_id,
      source.slug AS source_slug,
      source.name AS source_name,
      source.display_name AS source_display_name,
      source.href AS source_href,
      source.meta AS source_meta,
      target.id AS target_id,
      target.slug AS target_slug,
      target.name AS target_name,
      target.display_name AS target_display_name,
      target.href AS target_href,
      target.meta AS target_meta
    FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS source ON source.id = relation.source_tag_id
    JOIN dojo.tags AS target ON target.id = relation.target_tag_id
    WHERE target.slug = ${normalized}
      AND (${type}::text IS NULL OR relation.relation_type = ${type})
    ORDER BY relation.relation_type, source.slug, target.slug
  `;
  const rows = await selectRelations;
  return rows.map(relationFromRow);
}

export function listOutgoingIdentityRelations(
  slug: string,
  relationType?: string,
): Promise<IdentityRelation[]> {
  return listRelations(slug, "outgoing", relationType);
}

export function listIncomingIdentityRelations(
  slug: string,
  relationType?: string,
): Promise<IdentityRelation[]> {
  return listRelations(slug, "incoming", relationType);
}

export async function listIdentityGroups(slug: string): Promise<Identity[]> {
  const relations = await listOutgoingIdentityRelations(slug, "member_of");
  return relations.map((relation) => relation.target);
}

export async function listIdentityAncestorGroups(
  slug: string,
): Promise<Identity[]> {
  const normalized = normalizeTagSlug(slug);
  const rows = await sql<IdentityRow>`
    WITH RECURSIVE group_ids(group_tag_id) AS (
      SELECT relation.target_tag_id
      FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source ON source.id = relation.source_tag_id
      WHERE source.slug = ${normalized}
        AND relation.relation_type = 'member_of'

      UNION

      SELECT relation.target_tag_id
      FROM group_ids
      JOIN dojo.tag_relation AS relation
        ON relation.source_tag_id = group_ids.group_tag_id
      WHERE relation.relation_type = 'member_of'
    )
    SELECT target.id,
           target.slug,
           target.name,
           target.display_name,
           target.href,
           target.meta
    FROM group_ids
    JOIN dojo.tags AS target ON target.id = group_ids.group_tag_id
    ORDER BY COALESCE(target.display_name, target.name), target.slug
  `;
  return rows.map(identityFromRow);
}

export async function listIdentityDescendants(
  slug: string,
): Promise<Identity[]> {
  const normalized = normalizeTagSlug(slug);
  const rows = await sql<IdentityRow>`
    WITH RECURSIVE descendant_ids(descendant_tag_id) AS (
      SELECT relation.source_tag_id
      FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS target ON target.id = relation.target_tag_id
      WHERE target.slug = ${normalized}
        AND relation.relation_type = 'member_of'

      UNION

      SELECT relation.source_tag_id
      FROM descendant_ids
      JOIN dojo.tag_relation AS relation
        ON relation.target_tag_id = descendant_ids.descendant_tag_id
      WHERE relation.relation_type = 'member_of'
    )
    SELECT descendant.id,
           descendant.slug,
           descendant.name,
           descendant.display_name,
           descendant.href,
           descendant.meta
    FROM descendant_ids
    JOIN dojo.tags AS descendant
      ON descendant.id = descendant_ids.descendant_tag_id
    ORDER BY COALESCE(descendant.display_name, descendant.name), descendant.slug
  `;
  return rows.map(identityFromRow);
}

export async function listGroupMembers(slug: string): Promise<Identity[]> {
  const relations = await listIncomingIdentityRelations(slug, "member_of");
  return relations.map((relation) => relation.source);
}
