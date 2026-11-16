import { normalizeTagSlug } from "@/lib/tags";

export type TagAliasRow = { source_slug: string; target_slug: string | null };
export type TagAliasIndex = ReadonlyMap<string, string>;

/** A direct, reviewed alias is identity evidence; spelling similarities are not. */
export function buildTagAliasIndex(
  rows: readonly TagAliasRow[],
): TagAliasIndex {
  const aliases = new Map<string, string>();
  for (const row of rows) {
    const source = normalizeTagSlug(row.source_slug);
    const target = row.target_slug && normalizeTagSlug(row.target_slug);
    if (!source || !target || source === target || aliases.has(source)) {
      throw new Error("Invalid alias endpoints or multiple canonical targets");
    }
    aliases.set(source, target);
  }
  for (const target of aliases.values()) {
    if (aliases.has(target))
      throw new Error("Alias chains/cycles are unsupported");
  }
  return aliases;
}

export function canonicalTagSlug(tag: string, aliases: TagAliasIndex): string {
  const slug = normalizeTagSlug(tag);
  return aliases.get(slug) ?? slug;
}

export function equivalentTagSlugs(
  tag: string,
  aliases: TagAliasIndex,
): string[] {
  const canonical = canonicalTagSlug(tag, aliases);
  return [
    canonical,
    ...[...aliases]
      .filter(([, target]) => target === canonical)
      .map(([source]) => source),
  ];
}

export function canonicalTagSlugs(
  tags: readonly string[],
  aliases: TagAliasIndex,
): string[] {
  return [...new Set(tags.map((tag) => canonicalTagSlug(tag, aliases)))];
}
