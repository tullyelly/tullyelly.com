import type { Metadata } from "next";
import { DEFAULT_TWITTER_HANDLE, SITE_NAME } from "./constants";
import { clampDescription } from "./url";
import type { SeoInput, PageFrontmatter } from "./types";

/**
 * Build metadata for any page. Image fields are accepted (future) but NOT emitted yet.
 * Switch to include images by filling the images arrays where noted.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const {
    title,
    description,
    canonical,
    type = "website",
    robots,
    ogImage, // future
    twitterCard, // future-aware
    jsonld,
  } = input;

  const desc = clampDescription(description);

  const metadata: Metadata = {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description: desc,
      type,
      siteName: SITE_NAME,
      // Future: include images when you're ready.
      // images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard ?? "summary",
      title,
      description: desc,
      site: DEFAULT_TWITTER_HANDLE,
      creator: DEFAULT_TWITTER_HANDLE,
      // Future: include images when you're ready.
      // images: ogImage ? [ogImage.url] : undefined,
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
    // Future: map hero -> ogImage and switch twitterCard to 'summary_large_image'
  });
}
