import { allPosts, Post } from "contentlayer/generated";

export type RecentBlogPost = {
  slug: string;
  title: string;
  publishedAt: string;
};

export function isPublished(p: Post) {
  return !p.draft;
}

export function byDateDesc(a: Post, b: Post) {
  return (
    new Date(b.date).getTime() - new Date(a.date).getTime() ||
    a.slug.localeCompare(b.slug)
  );
}

export function getPublishedPosts(): Post[] {
  return allPosts.filter(isPublished).sort(byDateDesc);
}

export async function getRecentBlogPosts(limit = 5): Promise<RecentBlogPost[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;

  return getPublishedPosts()
    .slice(0, safeLimit)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      publishedAt: new Date(post.date).toISOString(),
    }));
}

export function getTagsWithCounts(posts: Post[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of posts) {
    for (const t of (p.tags ?? []).map((x) => x.toLowerCase())) {
      map[t] = (map[t] ?? 0) + 1;
    }
  }
  return map;
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * perPage;
  const end = start + perPage;
  return { items: items.slice(start, end), total, pages, current, perPage };
}
