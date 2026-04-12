import type { Metadata } from "next";

import { fmtDate } from "@/lib/datetime";
import type { BricksPageData } from "@/lib/bricks-content";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import type { BricksSubset } from "@/lib/bricks-types";

export function getBricksCollectionMetadata(subset: BricksSubset): Metadata {
  const config = getBricksRouteConfig(subset);

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

export function getBricksDetailMetadata(
  subset: BricksSubset,
  publicId: string,
  bricksData: BricksPageData | null,
): Metadata {
  const config = getBricksRouteConfig(subset);
  const title = `${bricksData?.setName ?? `LEGO Set ${publicId}`} | ${config.detailMetaSuffix}`;
  const encodedPublicId = encodeURIComponent(publicId);

  const description = bricksData
    ? (() => {
        const sessionCount = bricksData.sessionCount;
        const sessionLabel =
          sessionCount === 1
            ? config.countSingularLabel
            : config.countLabel.toLowerCase();
        const latestSessionDate = bricksData.latestBuildDate;
        const latestPhrase = latestSessionDate
          ? ` Latest chronicle: ${fmtDate(latestSessionDate)}.`
          : "";
        const piecePhrase =
          bricksData.pieceCount !== undefined
            ? ` ${bricksData.pieceCount} pieces.`
            : "";
        const tagPhrase = bricksData.tag ? ` Tag: ${bricksData.tag}.` : "";

        return `Overall score: ${bricksData.reviewScore.toFixed(1)}/10 from ${sessionCount} tracked ${sessionLabel}.${latestPhrase}${piecePhrase}${tagPhrase}`;
      })()
    : `DB-backed LEGO build dossier for LEGO ID ${publicId}. Chronicle sessions render from the original ReleaseSection MDX content.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `${config.collectionPath.slice(1)}/${encodedPublicId}`,
      ),
    },
    openGraph: {
      title,
      description,
      url: `${config.collectionPath}/${encodedPublicId}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
