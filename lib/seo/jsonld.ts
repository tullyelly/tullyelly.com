import type { PageFrontmatter } from "./types";

/**
 * Lightweight JSON-LD for Article (no image required).
 */
export function jsonldArticle(frontmatter: PageFrontmatter, canonical: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: canonical,
    headline: frontmatter.title,
    datePublished: frontmatter.date ?? undefined,
    dateModified: frontmatter.updated ?? frontmatter.date ?? undefined,
    author: frontmatter.author
      ? { "@type": "Person", name: frontmatter.author }
      : undefined,
  };
}

/**
 * JSON-LD for a Collection page (index/list).
 */
export function jsonldCollection(
  name: string,
  canonical: string,
  description?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    mainEntityOfPage: canonical,
    name,
    description,
  };
}
