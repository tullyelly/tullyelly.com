import "server-only";

import { allPosts } from "contentlayer/generated";

export type ChronicleTagCount = {
  tag: string;
  count: number;
};

export async function getTopChronicleTags(
  limit = 10,
): Promise<ChronicleTagCount[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;

  const counts = new Map<string, number>();
  for (const post of allPosts) {
    if (post.draft) continue;
    for (const tag of post.tags ?? []) {
      const normalized = tag.toLowerCase();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, safeLimit);
}
