import type { CSSProperties } from "react";

import type { BricksSubset } from "@/lib/bricks-types";
import {
  bricksPageThemeVarsBySubset,
  bricksTableThemeStyleBySubset,
} from "@/lib/bricks-theme";

export type BricksRouteConfig = {
  subset: BricksSubset;
  brandTitle: string;
  collectionMetaTitle: string;
  collectionMetaDescription: string;
  collectionHeroTitle: string;
  collectionHeroDescription: string;
  detailMetaSuffix: string;
  detailHeroEyebrow: string;
  collectionSectionEyebrow: string;
  detailBackLabel: string;
  subjectLabel: string;
  subjectIdLabel: string;
  tagLabel: string;
  pieceCountLabel: string;
  scoreLabel: string;
  countLabel: string;
  countSingularLabel: string;
  latestCountLabel: string;
  firstCountLabel: string;
  entryLabel: string;
  emptyCollectionMessage: string;
  emptyFeedMessage: string;
  missingContentMessage: string;
  collectionTableAriaLabel: string;
  collectionDirectoryHeading: string;
  detailFeedHeading: string;
  detailFeedDescription: string;
  pageThemeVars: CSSProperties;
  tableThemeStyle: CSSProperties;
  collectionPath: string;
};

export const BRICKS_ROUTE_CONFIG: Record<BricksSubset, BricksRouteConfig> = {
  lego: {
    subset: "lego",
    brandTitle: "🎙unclejimmy",
    collectionMetaTitle: "Bricks: LEGO | 🎙unclejimmy",
    collectionMetaDescription:
      "LEGO sets, ratings and build sessions with day-by-day stories from the Chronicles.",
    collectionHeroTitle: "Bricks: LEGO",
    collectionHeroDescription:
      "Explore LEGO sets, ratings and build sessions, then follow each build through its original stories.",
    detailMetaSuffix: "Bricks: LEGO | 🎙unclejimmy",
    detailHeroEyebrow: "LEGO Build Dossier",
    collectionSectionEyebrow: "Build Directory",
    detailBackLabel: "Back to Bricks: LEGO",
    subjectLabel: "Set",
    subjectIdLabel: "LEGO ID",
    tagLabel: "Tag",
    pieceCountLabel: "Pieces",
    scoreLabel: "Overall Score",
    countLabel: "Sessions",
    countSingularLabel: "session",
    latestCountLabel: "Last Session",
    firstCountLabel: "First Session",
    entryLabel: "Build Session",
    emptyCollectionMessage:
      "No LEGO build sets have been referenced in chronicles yet.",
    emptyFeedMessage: "No LEGO build sessions are tracked for this set yet.",
    missingContentMessage:
      "No chronicle build notes are attached to this session yet.",
    collectionTableAriaLabel: "Bricks: LEGO set table",
    collectionDirectoryHeading: "Tracked Sets",
    detailFeedHeading: "Chronicle Feed",
    detailFeedDescription:
      "Follow each build session in date order, with links to its original Chronicle.",
    pageThemeVars: bricksPageThemeVarsBySubset.lego,
    tableThemeStyle: bricksTableThemeStyleBySubset.lego,
    collectionPath: "/unclejimmy/bricks",
  },
};

export function getBricksRouteConfig(subset: BricksSubset): BricksRouteConfig {
  return BRICKS_ROUTE_CONFIG[subset];
}
