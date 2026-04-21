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
      "LEGO build sessions tracked from chronicles, with DB-backed set metadata and day-by-day narrative history.",
    collectionHeroTitle: "Bricks: LEGO",
    collectionHeroDescription:
      "Set dossiers organized by DB-backed bricks metadata, while the actual build notes stay in the original chronicle MDX sections.",
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
      "Each session below is grouped by the DB-backed build day while the narrative content stays in the original chronicle MDX.",
    pageThemeVars: bricksPageThemeVarsBySubset.lego,
    tableThemeStyle: bricksTableThemeStyleBySubset.lego,
    collectionPath: "/unclejimmy/bricks",
  },
};

export function getBricksRouteConfig(subset: BricksSubset): BricksRouteConfig {
  return BRICKS_ROUTE_CONFIG[subset];
}
