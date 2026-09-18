import type { Metadata } from "next";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
  SITE_NAME,
} from "./constants";
import { clampDescription } from "./url";
import type { SeoInput, PageFrontmatter } from "./types";

/** Build metadata with the site-wide preview image unless a route supplies one. */
export function buildMetadata(input: SeoInput): Metadata {
  const {
    title,
    description,
    canonical,
    type = "website",
    robots,
    ogImage,
    twitterCard,
    jsonld,
  } = input;

  const desc = clampDescription(description);

  const metadata: Metadata = {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title,
      description: desc,
      type,
      siteName: SITE_NAME,
      images: ogImage ? [ogImage] : SHARED_OPEN_GRAPH_FIELDS.images,
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
      card: twitterCard ?? "summary_large_image",
      title,
      description: desc,
      images: ogImage
        ? [{ url: ogImage.url, alt: ogImage.alt }]
        : SHARED_TWITTER_FIELDS.images,
    },
    robots: {
      index: robots?.index ?? true,
      follow: robots?.follow ?? true,
    },
    // Put JSON-LD via 'other' so we can inject it in the page component if desired.
    other: jsonld ? { __jsonld: JSON.stringify(jsonld) } : undefined,
  };

  return metadata;
}

/**
 * Convenience: from standardized blog frontmatter (no images yet).
 */
export function buildArticleMetadata(
  frontmatter: PageFrontmatter,
  canonical?: string,
): Metadata {
  return buildMetadata({
    title: frontmatter.title,
    description: frontmatter.summary,
    canonical,
    type: "article",
    robots: {
      index: frontmatter.published !== false,
      follow: frontmatter.published !== false,
    },
    // A future route may map its hero to ogImage.
  });
}
