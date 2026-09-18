import type { Post } from "contentlayer/generated";

import {
  rankRelatedContent,
  type RelatedContentResult,
  type RelatedContentSource,
} from "@/lib/related-content";

export type RelatedChronicle = RelatedContentResult;

export function toRelatedChronicleSource(post: Post): RelatedContentSource {
  return {
    id: post.slug,
    title: post.title,
    summary: post.summary,
    date: post.date,
    href: post.url,
    tags: post.tags ?? [],
    persona: post.resolvedAlterEgo,
    draft: post.draft,
  };
}

export function getRelatedChronicles(
  currentPost: Post,
  posts: readonly Post[],
  limit = 3,
): RelatedChronicle[] {
  return rankRelatedContent(
    toRelatedChronicleSource(currentPost),
    posts.map(toRelatedChronicleSource),
    { limit },
  );
}
