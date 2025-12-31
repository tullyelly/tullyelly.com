import type { ReactNode } from "react";

import { Badge } from "@/app/ui/Badge";
import {
  BADGE_VARIANTS,
  getBadgeClass,
  type BadgeVariant,
} from "@/app/ui/badge-maps";
import { getScroll } from "@/lib/scrolls";

type Props = {
  alterEgo: string;
  children: ReactNode;
  divider?: boolean;
  releaseId?: string;
};

const RELEASE_TYPE_VARIANTS: Record<string, BadgeVariant> = {
  hotfix: "hotfix",
  patch: "hotfix",
  minor: "minor",
  major: "major",
  planned: "planned",
  released: "released",
  classic: "classic",
  year: "year",
};

const COLOR_OVERRIDES: Record<string, string> = {
  "brand-bucksGreen": "#00471B",
  "brand-creamCityCream": "#EEE1C6",
  "brand-greatLakesBlue": "#0077C0",
  white: "#FFFFFF",
  black: "#000000",
};

function parseBadgeBackgroundColor(badgeClass: string): string | null {
  const bgMatch = badgeClass.match(/bg-((?:\[[^\]]+])|[^\s]+)/);
  if (!bgMatch) return null;

  const token =
    bgMatch[1].startsWith("[") && bgMatch[1].endsWith("]")
      ? bgMatch[1].slice(1, -1)
      : bgMatch[1];

  if (token in COLOR_OVERRIDES) return COLOR_OVERRIDES[token];
  if (token.startsWith("#")) return token;
  return null;
}

function parseBadgeTextColor(badgeClass: string): string | null {
  const textMatch = badgeClass.match(/text-((?:\[[^\]]+])|[^\s]+)/);
  if (!textMatch) return null;

  const token =
    textMatch[1].startsWith("[") && textMatch[1].endsWith("]")
      ? textMatch[1].slice(1, -1)
      : textMatch[1];

  if (token in COLOR_OVERRIDES) return COLOR_OVERRIDES[token];
  if (token.startsWith("#")) return token;
  return null;
}

const archivedReleaseColor =
  parseBadgeBackgroundColor(BADGE_VARIANTS.archived) ?? "#EEE1C6";
const archivedTextColor =
  parseBadgeTextColor(BADGE_VARIANTS.archived) ?? "#1A1A1A";

function getBadgeBackgroundColor(variant: BadgeVariant): string {
  return (
    parseBadgeBackgroundColor(BADGE_VARIANTS[variant]) ?? archivedReleaseColor
  );
}

function getBadgeTextColor(variant: BadgeVariant): string {
  return parseBadgeTextColor(BADGE_VARIANTS[variant]) ?? archivedTextColor;
}

function getReleaseTypeColor(releaseType?: string): string {
  if (!releaseType) return archivedReleaseColor;

  const normalized = releaseType.toLowerCase();
  const variant =
    RELEASE_TYPE_VARIANTS[normalized] ||
    (Object.prototype.hasOwnProperty.call(BADGE_VARIANTS, normalized)
      ? (normalized as BadgeVariant)
      : "archived");

  return getBadgeBackgroundColor(variant);
}

function getReleaseTypeTextColor(releaseType?: string): string {
  if (!releaseType) return archivedTextColor;

  const normalized = releaseType.toLowerCase();
  const variant =
    RELEASE_TYPE_VARIANTS[normalized] ||
    (Object.prototype.hasOwnProperty.call(BADGE_VARIANTS, normalized)
      ? (normalized as BadgeVariant)
      : "archived");

  return getBadgeTextColor(variant);
}

// ReleaseSection acts as a no-op wrapper for MDX content and optionally renders a
// divider after the block (Great Lakes blue hr from global MDX styles).
export default async function ReleaseSection({
  alterEgo,
  children,
  divider = true,
  releaseId,
}: Props) {
  let releaseName: string | undefined;
  let releaseType: string | undefined;

  if (releaseId) {
    const release = await getScroll(releaseId);
    releaseName = release?.release_name;
    releaseType = release?.release_type;
  }

  const showReleaseDetails = Boolean(releaseId);
  const releaseColor = showReleaseDetails
    ? getReleaseTypeColor(releaseType)
    : undefined;
  const releaseTextColor = showReleaseDetails
    ? getReleaseTypeTextColor(releaseType)
    : undefined;

  const baseContent = (
    <div
      className="space-y-3"
      data-release-name={releaseName ?? undefined}
      data-release-type={releaseType ?? undefined}
      data-release-color={releaseColor}
      data-release-text-color={releaseTextColor}
    >
      {children}
      <div className="flex justify-end">
        <Badge className={getBadgeClass("planned")}>#{String(alterEgo)}</Badge>
      </div>
    </div>
  );

  if (!showReleaseDetails) {
    return (
      <>
        {baseContent}
        {divider ? (
          <hr className="my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]" />
        ) : null}
      </>
    );
  }

  const borderStyle = {
    borderColor: releaseColor,
    borderWidth: "4px",
  };
  const tabStyle = {
    backgroundColor: releaseColor,
    borderColor: releaseColor,
    color: releaseTextColor,
  };

  return (
    <>
      <div
        className="relative rounded-lg border-[4px] px-4 pt-8 pb-4"
        style={borderStyle}
      >
        {releaseName || releaseId ? (
          <span
            className="absolute -top-[4px] left-[-4px] inline-flex items-center rounded-tl-lg rounded-tr-md border-[4px] border-b-0 px-3 py-1 text-sm font-semibold leading-none"
            style={tabStyle}
          >
            {releaseName ?? releaseId}
          </span>
        ) : null}
        {baseContent}
      </div>
    </>
  );
}
