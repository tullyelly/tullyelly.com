import "server-only";

import type { Post } from "contentlayer/generated";
import { getPublishedPosts } from "@/lib/blog";
import { flattenLinks } from "@/lib/menu.flatten";
import { getMenu } from "@/lib/menu/getMenu";

export const DEFAULT_SITE_SEARCH_LIMIT = 30;

export type SiteSearchDocument = {
  type: "page" | "chronicle";
  title: string;
  href: string;
  description: string;
  keywords: string[];
  category?: string;
  persona?: string;
  external?: boolean;
  target?: "_self" | "_blank";
};

export type SiteSearchResult = SiteSearchDocument & {
  score: number;
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function canonicalHref(href: string): string {
  const normalized = href.trim();
  if (normalized === "/") return normalized;
  return normalized.replace(/\/$/, "");
}

function scoreDocument(document: SiteSearchDocument, query: string): number {
  const needle = normalize(query);
  if (!needle) return 0;

  let score = 0;
  const title = normalize(document.title);
  if (title === needle) score += 100;
  else if (title.includes(needle)) score += 70;

  const keywords = document.keywords.map(normalize);
  if (keywords.some((value) => value === needle)) score += 50;
  else if (keywords.some((value) => value.includes(needle))) score += 35;

  if (normalize(document.description).includes(needle)) score += 20;
  if (normalize(document.persona ?? "").includes(needle)) score += 15;
  if (normalize(document.category ?? "").includes(needle)) score += 15;
  if (normalize(document.href).includes(needle)) score += 5;

  return score;
}

function buildPageDocuments(
  tree: Awaited<ReturnType<typeof getMenu>>["tree"],
): SiteSearchDocument[] {
  return flattenLinks(tree).map((link) => {
    const context = link.pathLabels.slice(0, -1).join(" / ");
    return {
      type: "page",
      title: link.label,
      href: link.href,
      description: context,
      keywords: link.keywords,
      category: context || undefined,
      persona: link.persona?.label,
      external: link.kind === "external",
      target: link.target,
    };
  });
}

function buildChronicleDocuments(posts: readonly Post[]): SiteSearchDocument[] {
  return posts
    .filter((post) => !post.draft)
    .map((post) => ({
      type: "chronicle" as const,
      title: post.title,
      href: post.url,
      description: post.summary,
      keywords: post.tags ?? [],
      category: "Chronicle",
      persona: post.resolvedAlterEgo,
    }));
}

export function rankSiteSearchDocuments(
  documents: readonly SiteSearchDocument[],
  query: string,
  limit = DEFAULT_SITE_SEARCH_LIMIT,
): SiteSearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || limit <= 0) return [];

  const byHref = new Map<string, SiteSearchResult>();
  for (const document of documents) {
    const score = scoreDocument(document, normalizedQuery);
    if (score <= 0) continue;

    const key = canonicalHref(document.href);
    const existing = byHref.get(key);
    if (!existing || score > existing.score) {
      byHref.set(key, { ...document, score });
    }
  }

  return Array.from(byHref.values())
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.title.localeCompare(b.title) ||
        a.href.localeCompare(b.href),
    )
    .slice(0, Math.floor(limit));
}

export async function searchSite(
  query: string,
  limit = DEFAULT_SITE_SEARCH_LIMIT,
): Promise<SiteSearchResult[]> {
  if (!normalize(query)) return [];

  const [{ tree }, posts] = await Promise.all([
    getMenu(),
    Promise.resolve(getPublishedPosts()),
  ]);
  return rankSiteSearchDocuments(
    [...buildPageDocuments(tree), ...buildChronicleDocuments(posts)],
    query,
    limit,
  );
}
