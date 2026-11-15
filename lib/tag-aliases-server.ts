import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";
import {
  buildTagAliasIndex,
  canonicalTagSlug,
  equivalentTagSlugs,
  type TagAliasIndex,
  type TagAliasRow,
} from "@/lib/tag-aliases";

/** Request-scoped, public identity data only. No cross-user/session cache. */
export const getTagAliasSnapshot = cache(async (): Promise<TagAliasIndex> => {
  if (isNextBuild()) return new Map();
  try {
    const rows = await sql<TagAliasRow>`
      SELECT source.slug AS source_slug, target.slug AS target_slug
      FROM dojo.tag_relation relation
      JOIN dojo.tags source ON source.id=relation.source_tag_id
      LEFT JOIN dojo.tags target ON target.id=relation.target_tag_id
      WHERE relation.relation_type='alias_of'
      ORDER BY relation.id
    `;
    return buildTagAliasIndex(rows);
  } catch (error) {
    console.warn(
      "[aliases] Invalid or unavailable aliases; preserving exact-tag fallback",
      error,
    );
    return new Map();
  }
});
export async function resolveCanonicalTagSlug(tag: string): Promise<string> {
  return canonicalTagSlug(tag, await getTagAliasSnapshot());
}
export async function listEquivalentTagSlugs(
  tags: readonly string[],
): Promise<string[]> {
  const aliases = await getTagAliasSnapshot();
  return [...new Set(tags.flatMap((tag) => equivalentTagSlugs(tag, aliases)))];
}
