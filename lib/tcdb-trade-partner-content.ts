import { allPosts } from "contentlayer/generated";
import type { TaggedPost } from "@/lib/blog";
import type { TcdbTradePartnerContentTag } from "@/lib/tcdb-trade-partners-db";

export type RelatedTradePartnerChronicle = TaggedPost & { reasons: string[] };

export function getRelatedTradePartnerChronicles(
  tradeIds: readonly string[],
  contentTags: readonly TcdbTradePartnerContentTag[],
): RelatedTradePartnerChronicle[] {
  const tagReasons = new Map<string, Set<string>>();
  for (const tag of contentTags) {
    const reasons = tagReasons.get(tag.slug.toLowerCase()) ?? new Set<string>();
    reasons.add(
      tag.sourceType === "tag" && tag.tagType ? tag.tagType : tag.sourceType,
    );
    tagReasons.set(tag.slug.toLowerCase(), reasons);
  }

  return allPosts
    .filter((post) => !post.draft)
    .flatMap((post) => {
      const reasons = new Set<string>();
      const raw = post.body?.raw ?? "";
      if (tradeIds.some((tradeId) => raw.includes(`tcdbTradeId="${tradeId}"`)))
        reasons.add("trade");
      for (const tag of post.tags ?? []) {
        for (const reason of tagReasons.get(tag.toLowerCase()) ?? [])
          reasons.add(reason);
      }
      return reasons.size === 0
        ? []
        : [
            {
              slug: post.slug,
              title: post.title,
              summary: post.summary ?? "",
              date: post.date,
              url: post.url,
              tags: (post.tags ?? []).map((tag) => tag.toLowerCase()),
              reasons: [...reasons],
            },
          ];
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        a.slug.localeCompare(b.slug),
    );
}
