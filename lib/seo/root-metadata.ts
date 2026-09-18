import type { Metadata } from "next";

import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "./constants";

export function buildRootMetadata(pageTitle?: string): Metadata {
  const openGraphTitle = pageTitle ? `${pageTitle}; ${SITE_TITLE}` : SITE_TITLE;

  return {
    metadataBase: new URL(SITE_URL),
    title: pageTitle || SITE_TITLE,
    description: SITE_DESCRIPTION,
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title: openGraphTitle,
      description: SITE_DESCRIPTION,
      type: "website",
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
