import type { Metadata } from "next";

import { fmtDate } from "@/lib/datetime";
import type { UspsPageData } from "@/lib/usps-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { getUspsRouteConfig } from "@/lib/usps-route-config";

export function getUspsCollectionMetadata(): Metadata {
  const config = getUspsRouteConfig();

  return {
    title: config.collectionMetaTitle,
    description: config.collectionMetaDescription,
    alternates: { canonical: canonicalUrl(config.collectionPath.slice(1)) },
    openGraph: {
      title: config.collectionMetaTitle,
      description: config.collectionMetaDescription,
      url: config.collectionPath,
      type: "website",
    },
    twitter: {
      card: "summary",
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
      title,
      description,
      url: `${config.collectionPath}/${encodedCitySlug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
