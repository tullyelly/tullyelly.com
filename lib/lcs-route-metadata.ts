import type { Metadata } from "next";

import { fmtDate } from "@/lib/datetime";
import type { LcsPageData } from "@/lib/lcs-content";
import { getLcsRouteConfig } from "@/lib/lcs-route-config";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

function formatLocation(lcsData: Pick<LcsPageData, "city" | "state">): string | null {
  const parts = [lcsData.city, lcsData.state].filter(
    (value): value is string => Boolean(value),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

export function getLcsCollectionMetadata(): Metadata {
  const config = getLcsRouteConfig();

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

export function getLcsDetailMetadata(
  slug: string,
  lcsData: LcsPageData | null,
): Metadata {
  const config = getLcsRouteConfig();
  const encodedSlug = encodeURIComponent(slug);
  const title = lcsData
    ? `${lcsData.name} | ${config.detailMetaSuffix}`
    : `${slug} | ${config.detailMetaSuffix}`;

  const description = lcsData
    ? (() => {
        const visitLabel =
          lcsData.visitCount === 1
            ? config.countSingularLabel
            : config.countLabel.toLowerCase();
        const location = formatLocation(lcsData);
        const locationPhrase = location ? ` Location: ${location}.` : "";
        const firstVisitPhrase = lcsData.firstVisitDate
          ? ` First visit: ${fmtDate(lcsData.firstVisitDate)}.`
          : "";
        const latestVisitPhrase = lcsData.latestVisitDate
          ? ` Latest visit: ${fmtDate(lcsData.latestVisitDate)}.`
          : "";

        return `Rating: ${lcsData.rating.toFixed(1)}/10 across ${lcsData.visitCount} tracked ${visitLabel}.${locationPhrase}${firstVisitPhrase}${latestVisitPhrase}`;
      })()
    : `DB-backed local card shop dossier for ${slug}. Chronicle visit notes render from the original ReleaseSection MDX content.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `${config.collectionPath.slice(1)}/${encodedSlug}`,
      ),
    },
    openGraph: {
      title,
      description,
      url: `${config.collectionPath}/${encodedSlug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
