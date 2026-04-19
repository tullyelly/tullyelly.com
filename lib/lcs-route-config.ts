import type { CSSProperties } from "react";

import { lcsPageThemeVars, lcsTableThemeStyle } from "@/lib/lcs-theme";

export type LcsRouteConfig = {
  brandTitle: string;
  collectionMetaTitle: string;
  collectionMetaDescription: string;
  collectionHeroTitle: string;
  collectionHeroDescription: string;
  detailMetaSuffix: string;
  detailHeroEyebrow: string;
  collectionSectionEyebrow: string;
  detailBackLabel: string;
  shopLabel: string;
  slugLabel: string;
  locationLabel: string;
  siteLabel: string;
  ratingLabel: string;
  countLabel: string;
  countSingularLabel: string;
  firstCountLabel: string;
  latestCountLabel: string;
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

export const LCS_ROUTE_CONFIG: LcsRouteConfig = {
  brandTitle: "🃏cardattack",
  collectionMetaTitle: "LCS | 🃏cardattack",
  collectionMetaDescription:
    "Local card shop visits tracked from chronicles, with DB-backed shop metadata and visit-day history.",
  collectionHeroTitle: "Local Card Shops",
  collectionHeroDescription:
    "Card shop dossiers are keyed by DB-backed LCS records and visit dates, while the narrative visit notes still render from the original chronicle MDX.",
  detailMetaSuffix: "LCS | 🃏cardattack",
  detailHeroEyebrow: "Card Shop Dossier",
  collectionSectionEyebrow: "LCS Directory",
  detailBackLabel: "Back to local card shops",
  shopLabel: "Card Shop",
  slugLabel: "Slug",
  locationLabel: "Location",
  siteLabel: "Shop Site",
  ratingLabel: "Rating",
  countLabel: "Visits",
  countSingularLabel: "visit",
  firstCountLabel: "First Visit",
  latestCountLabel: "Latest Visit",
  entryLabel: "Visit",
  emptyCollectionMessage:
    "No local card shops have been referenced in chronicles yet.",
  emptyFeedMessage: "No local card shop visits are tracked for this shop yet.",
  missingContentMessage:
    "No chronicle card shop notes are attached to this visit day yet.",
  collectionTableAriaLabel: "Local card shops table",
  collectionDirectoryHeading: "Tracked Shops",
  detailFeedHeading: "Chronicle Feed",
  detailFeedDescription:
    "Each visit day below comes from the DB-backed LCS log, while the narrative content still renders from the original chronicle MDX.",
  pageThemeVars: lcsPageThemeVars,
  tableThemeStyle: lcsTableThemeStyle,
  collectionPath: "/cardattack/lcs",
};

export function getLcsRouteConfig(): LcsRouteConfig {
  return LCS_ROUTE_CONFIG;
}
