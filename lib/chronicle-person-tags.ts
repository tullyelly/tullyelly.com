import { allPosts } from "contentlayer/generated";
import { normalizeTagSlug } from "@/lib/tags";

export type ChroniclePersonTagUsage = {
  tag: string;
  displayName: string;
};

export type ChroniclePersonTagSource = {
  slug: string;
  draft?: boolean;
  personTagUsages?: unknown;
};

export type ChronicleTagDisplayName = {
  displayName: string;
  count: number;
  chronicleCount: number;
};

function isChroniclePersonTagUsage(
  value: unknown,
): value is ChroniclePersonTagUsage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.tag === "string" &&
    typeof candidate.displayName === "string"
  );
}

function getPersonTagUsages(
  post: ChroniclePersonTagSource,
): ChroniclePersonTagUsage[] {
  if (!Array.isArray(post.personTagUsages)) return [];
  return post.personTagUsages.filter(isChroniclePersonTagUsage);
}

function trimToValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function collectChronicleTagDisplayNames(
  posts: readonly ChroniclePersonTagSource[],
  tag: string,
): ChronicleTagDisplayName[] {
  const targetSlug = normalizeTagSlug(tag);
  if (!targetSlug) return [];

  const byDisplayName = new Map<
    string,
    { displayName: string; count: number; chronicleSlugs: Set<string> }
  >();

  for (const post of posts) {
    if (post.draft) continue;

    for (const usage of getPersonTagUsages(post)) {
      if (normalizeTagSlug(usage.tag) !== targetSlug) continue;

      const displayName = trimToValue(usage.displayName) ?? usage.tag;
      const key = displayName;
      const existing = byDisplayName.get(key);

      if (existing) {
        existing.count += 1;
        existing.chronicleSlugs.add(post.slug);
      } else {
        byDisplayName.set(key, {
          displayName,
          count: 1,
          chronicleSlugs: new Set([post.slug]),
        });
      }
    }
  }

  return Array.from(byDisplayName.values())
    .map(({ displayName, count, chronicleSlugs }) => ({
      displayName,
      count,
      chronicleCount: chronicleSlugs.size,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.displayName.localeCompare(b.displayName);
    });
}

export function listChronicleTagDisplayNames(
  tag: string,
): ChronicleTagDisplayName[] {
  return collectChronicleTagDisplayNames(
    allPosts as readonly ChroniclePersonTagSource[],
    tag,
  );
}
