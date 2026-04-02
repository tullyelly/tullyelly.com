import type { CSSProperties } from "react";

import { REVIEW_TYPE_CONFIG, type ReviewType } from "@/lib/review-types";
import {
  reviewPageThemeVarsByType,
  reviewTableThemeStyleByType,
} from "@/lib/review-theme";

export type ReviewRouteConfig = {
  type: ReviewType;
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
  countLabel: string;
  countSingularLabel: string;
  latestCountLabel: string;
  entryLabel: string;
  outboundLinkLabel: string;
  tableExternalLinkLabel: string;
  emptyCollectionMessage: string;
  emptyFeedMessage: string;
  collectionTableAriaLabel: string;
  collectionTableFirstColumnLabel: string;
  collectionDirectoryHeading: string;
  detailFeedHeading: string;
  detailFeedDescription: string;
  pageThemeVars: CSSProperties;
  tableThemeStyle: CSSProperties;
  collectionPath: string;
  label: string;
  singularLabel: string;
};

export const REVIEW_ROUTE_CONFIG: Record<ReviewType, ReviewRouteConfig> = {
  lcs: {
    type: "lcs",
    brandTitle: "🃏cardattack",
    collectionMetaTitle: "LCS | 🃏cardattack",
    collectionMetaDescription:
      "Local card shop visits tracked from chronicles, with normalized ratings and visit history by shop.",
    collectionHeroTitle: "Local Card Shops",
    collectionHeroDescription:
      "Normalized card shop dossiers built from review metadata, with every visit still rendered from the original chronicle MDX sections.",
    detailMetaSuffix: "🃏cardattack lcs",
    detailHeroEyebrow: "Card Shop Dossier",
    collectionSectionEyebrow: "Review Directory",
    detailBackLabel: "Back to local card shops",
    subjectLabel: "Card Shop",
    subjectIdLabel: "Shop ID",
    countLabel: "Visits",
    countSingularLabel: "visit",
    latestCountLabel: "Last Visit",
    entryLabel: "Visit",
    outboundLinkLabel: "Visit shop site",
    tableExternalLinkLabel: "shop site",
    emptyCollectionMessage:
      "No local card shop reviews have been referenced in chronicles yet.",
    emptyFeedMessage: "No chronicle visits are attached to this card shop yet.",
    collectionTableAriaLabel: "Local card shops table",
    collectionTableFirstColumnLabel: "Card Shop",
    collectionDirectoryHeading: "Tracked Shops",
    detailFeedHeading: "Chronicle Feed",
    detailFeedDescription:
      "Every entry below is compiled from the original chronicle MDX source.",
    pageThemeVars: reviewPageThemeVarsByType.lcs,
    tableThemeStyle: reviewTableThemeStyleByType.lcs,
    collectionPath: REVIEW_TYPE_CONFIG.lcs.collectionPath,
    label: REVIEW_TYPE_CONFIG.lcs.label,
    singularLabel: REVIEW_TYPE_CONFIG.lcs.singularLabel,
  },
  "table-schema": {
    type: "table-schema",
    brandTitle: "🎙unclejimmy",
    collectionMetaTitle: "Table Schema | 🎙unclejimmy",
    collectionMetaDescription:
      "Restaurant visits tracked from chronicles, with normalized ratings and visit history by establishment.",
    collectionHeroTitle: "Table Schema",
    collectionHeroDescription:
      "Restaurant dossiers driven by normalized review metadata, while the actual meal notes and commentary stay in the chronicle MDX files.",
    detailMetaSuffix: "🎙unclejimmy table schema",
    detailHeroEyebrow: "Restaurant Dossier",
    collectionSectionEyebrow: "Review Directory",
    detailBackLabel: "Back to table schema",
    subjectLabel: "Restaurant",
    subjectIdLabel: "Table Schema ID",
    countLabel: "Visits",
    countSingularLabel: "visit",
    latestCountLabel: "Last Visit",
    entryLabel: "Visit",
    outboundLinkLabel: "Visit restaurant site",
    tableExternalLinkLabel: "restaurant site",
    emptyCollectionMessage:
      "No table schema reviews have been referenced in chronicles yet.",
    emptyFeedMessage: "No chronicle visits are attached to this restaurant yet.",
    collectionTableAriaLabel: "Table schema restaurants table",
    collectionTableFirstColumnLabel: "Establishment",
    collectionDirectoryHeading: "Tracked Establishments",
    detailFeedHeading: "Chronicle Feed",
    detailFeedDescription:
      "Every entry below is compiled from the original chronicle MDX source.",
    pageThemeVars: reviewPageThemeVarsByType["table-schema"],
    tableThemeStyle: reviewTableThemeStyleByType["table-schema"],
    collectionPath: REVIEW_TYPE_CONFIG["table-schema"].collectionPath,
    label: REVIEW_TYPE_CONFIG["table-schema"].label,
    singularLabel: REVIEW_TYPE_CONFIG["table-schema"].singularLabel,
  },
  "save-point": {
    type: "save-point",
    brandTitle: "🎙unclejimmy",
    collectionMetaTitle: "Call A Save Point | 🎙unclejimmy",
    collectionMetaDescription:
      "Video game reviews tracked from chronicles, with normalized ratings and review history by game.",
    collectionHeroTitle: "Call A Save Point",
    collectionHeroDescription:
      "Video game dossiers organized by normalized review metadata, while the actual narrative review text still comes from the chronicle MDX sections.",
    detailMetaSuffix: "🎙unclejimmy call a save point",
    detailHeroEyebrow: "Game Dossier",
    collectionSectionEyebrow: "Review Directory",
    detailBackLabel: "Back to call a save point",
    subjectLabel: "Video Game",
    subjectIdLabel: "Save Point ID",
    countLabel: "Reviews",
    countSingularLabel: "review",
    latestCountLabel: "Last Review",
    entryLabel: "Review",
    outboundLinkLabel: "Visit game site",
    tableExternalLinkLabel: "game site",
    emptyCollectionMessage:
      "No save point reviews have been referenced in chronicles yet.",
    emptyFeedMessage: "No chronicle reviews are attached to this game yet.",
    collectionTableAriaLabel: "Save point reviews table",
    collectionTableFirstColumnLabel: "Game",
    collectionDirectoryHeading: "Tracked Games",
    detailFeedHeading: "Chronicle Feed",
    detailFeedDescription:
      "Every entry below is compiled from the original chronicle MDX source.",
    pageThemeVars: reviewPageThemeVarsByType["save-point"],
    tableThemeStyle: reviewTableThemeStyleByType["save-point"],
    collectionPath: REVIEW_TYPE_CONFIG["save-point"].collectionPath,
    label: REVIEW_TYPE_CONFIG["save-point"].label,
    singularLabel: REVIEW_TYPE_CONFIG["save-point"].singularLabel,
  },
  "golden-age": {
    type: "golden-age",
    brandTitle: "🎙unclejimmy",
    collectionMetaTitle: "Golden Age | 🎙unclejimmy",
    collectionMetaDescription:
      "Antique shop visits tracked from chronicles, with normalized ratings and visit history by location.",
    collectionHeroTitle: "Golden Age",
    collectionHeroDescription:
      "Antique shop dossiers organized by normalized review metadata, while the actual hunt notes and story beats remain MDX-authored chronicle content.",
    detailMetaSuffix: "🎙unclejimmy golden age",
    detailHeroEyebrow: "Antique Shop Dossier",
    collectionSectionEyebrow: "Review Directory",
    detailBackLabel: "Back to golden age",
    subjectLabel: "Antique Shop",
    subjectIdLabel: "Golden Age ID",
    countLabel: "Visits",
    countSingularLabel: "visit",
    latestCountLabel: "Last Visit",
    entryLabel: "Visit",
    outboundLinkLabel: "Visit shop site",
    tableExternalLinkLabel: "shop site",
    emptyCollectionMessage:
      "No golden age visits have been referenced in chronicles yet.",
    emptyFeedMessage:
      "No chronicle visits are attached to this antique shop yet.",
    collectionTableAriaLabel: "Golden age antique shops table",
    collectionTableFirstColumnLabel: "Antique Shop",
    collectionDirectoryHeading: "Tracked Shops",
    detailFeedHeading: "Chronicle Feed",
    detailFeedDescription:
      "Every entry below is compiled from the original chronicle MDX source.",
    pageThemeVars: reviewPageThemeVarsByType["golden-age"],
    tableThemeStyle: reviewTableThemeStyleByType["golden-age"],
    collectionPath: REVIEW_TYPE_CONFIG["golden-age"].collectionPath,
    label: REVIEW_TYPE_CONFIG["golden-age"].label,
    singularLabel: REVIEW_TYPE_CONFIG["golden-age"].singularLabel,
  },
};

export function getReviewRouteConfig(reviewType: ReviewType): ReviewRouteConfig {
  return REVIEW_ROUTE_CONFIG[reviewType];
}
