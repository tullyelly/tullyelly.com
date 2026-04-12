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
  legoId: string,
  bricksData: BricksPageData | null,
): Metadata {
  const config = getBricksRouteConfig(subset);
  const setName = bricksData?.setName ?? `LEGO Set ${legoId}`;
  const score = bricksData?.reviewScore ?? 0;
  const sessionCount = bricksData?.sessionCount ?? 0;
  const sessionLabel =
    sessionCount === 1
      ? config.countSingularLabel
      : config.countLabel.toLowerCase();
  const latestSessionDate = bricksData?.latestBuildDate;
  const latestPhrase = latestSessionDate
    ? ` Latest chronicle: ${fmtDate(latestSessionDate)}.`
    : "";
  const piecePhrase =
    bricksData?.pieceCount !== undefined
      ? ` ${bricksData.pieceCount} pieces.`
      : "";
  const tagPhrase = bricksData?.tag ? ` Tag: ${bricksData.tag}.` : "";
  const title = `${setName} | ${config.detailMetaSuffix}`;
  const description = `Overall score: ${score.toFixed(1)}/10 from ${sessionCount} tracked ${sessionLabel}.${latestPhrase}${piecePhrase}${tagPhrase}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(
        `${config.collectionPath.slice(1)}/${encodeURIComponent(legoId)}`,
      ),
    },
    openGraph: {
      title,
      description,
      url: `${config.collectionPath}/${encodeURIComponent(legoId)}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
