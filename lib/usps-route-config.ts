import type { CSSProperties } from "react";

import { uspsPageThemeVars, uspsTableThemeStyle } from "@/lib/usps-theme";

export type UspsRouteConfig = {
  brandTitle: string;
  collectionMetaTitle: string;
  collectionMetaDescription: string;
  collectionHeroTitle: string;
  collectionHeroDescription: string;
  detailMetaSuffix: string;
  detailHeroEyebrow: string;
  collectionSectionEyebrow: string;
  detailBackLabel: string;
  locationLabel: string;
  stateLabel: string;
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

export const USPS_ROUTE_CONFIG: UspsRouteConfig = {
  brandTitle: "🃏cardattack",
  collectionMetaTitle: "USPS | 🃏cardattack",
  collectionMetaDescription:
    "USPS location visits tracked from chronicles, with normalized city ratings and day-by-day visit history.",
  collectionHeroTitle: "USPS",
  collectionHeroDescription:
    "Browse USPS locations, ratings and visit dates, then revisit the mailing-day stories.",
  detailMetaSuffix: "USPS | 🃏cardattack",
  detailHeroEyebrow: "USPS Location Dossier",
  collectionSectionEyebrow: "USPS Directory",
  detailBackLabel: "Back to USPS",
  locationLabel: "Location",
  stateLabel: "State",
  ratingLabel: "Rating",
  countLabel: "Visits",
  countSingularLabel: "visit",
  firstCountLabel: "First Visit",
  latestCountLabel: "Latest Visit",
  entryLabel: "Visit",
  emptyCollectionMessage:
    "No USPS locations have been referenced in chronicles yet.",
  emptyFeedMessage: "No USPS visits are tracked for this location yet.",
  missingContentMessage:
    "No chronicle mailing notes are attached to this visit day yet.",
  collectionTableAriaLabel: "USPS locations table",
  collectionDirectoryHeading: "Tracked Locations",
  detailFeedHeading: "Chronicle Feed",
  detailFeedDescription:
    "Follow the mailing-day stories in date order, with links to their original Chronicles.",
  pageThemeVars: uspsPageThemeVars,
  tableThemeStyle: uspsTableThemeStyle,
  collectionPath: "/cardattack/usps",
};

export function getUspsRouteConfig(): UspsRouteConfig {
  return USPS_ROUTE_CONFIG;
}
