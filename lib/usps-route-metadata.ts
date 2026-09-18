import type { Metadata } from "next";

import { fmtDate } from "@/lib/datetime";
import type { UspsPageData } from "@/lib/usps-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";
import { getUspsRouteConfig } from "@/lib/usps-route-config";

export function getUspsCollectionMetadata(): Metadata {
  const config = getUspsRouteConfig();

  return {
    title: config.collectionMetaTitle,
    description: config.collectionMetaDescription,
    alternates: { canonical: canonicalUrl(config.collectionPath.slice(1)) },
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title: config.collectionMetaTitle,
      description: config.collectionMetaDescription,
      url: config.collectionPath,
      type: "website",
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
      title: config.collectionMetaTitle,
      description: config.collectionMetaDescription,
    },
  };
}

export function getUspsDetailMetadata(
  citySlug: string,
  uspsData: UspsPageData | null,
): Metadata {
  const config = getUspsRouteConfig();
  const encodedCitySlug = encodeURIComponent(citySlug);
  const title = uspsData
    ? `${uspsData.cityName}, ${uspsData.state} | ${config.detailMetaSuffix}`
    : `${citySlug} | ${config.detailMetaSuffix}`;

  const description = uspsData
    ? (() => {
        const visitLabel =
          uspsData.visitCount === 1
            ? config.countSingularLabel
            : config.countLabel.toLowerCase();
        const firstVisitPhrase = uspsData.firstVisitDate
          ? ` First visit: ${fmtDate(uspsData.firstVisitDate)}.`
          : "";
        const latestVisitPhrase = uspsData.latestVisitDate
          ? ` Latest visit: ${fmtDate(uspsData.latestVisitDate)}.`
          : "";

        return `Rating: ${uspsData.rating.toFixed(1)}/10 across ${uspsData.visitCount} tracked ${visitLabel}.${firstVisitPhrase}${latestVisitPhrase}`;
      })()
    : `DB-backed USPS location dossier for ${citySlug}. Chronicle visit notes render from the original ReleaseSection MDX content.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `${config.collectionPath.slice(1)}/${encodedCitySlug}`,
      ),
    },
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title,
      description,
      url: `${config.collectionPath}/${encodedCitySlug}`,
      type: "website",
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
      title,
      description,
    },
  };
}
