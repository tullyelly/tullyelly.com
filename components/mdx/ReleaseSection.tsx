import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/app/ui/Badge";
import {
  BADGE_VARIANTS,
  getBadgeClass,
  type BadgeVariant,
} from "@/app/ui/badge-maps";
import {
  PILL_BLUE,
  PILL_BLACK,
  PILL_CREAM_CITY,
  pillInteractionClasses,
} from "@/components/ui/pillStyles";
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
        <Link
          href={`/shaolin/tags/${encodeURIComponent(alterEgo.toLowerCase())}`}
          prefetch={false}
          className={[
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold leading-none",
            pillInteractionClasses,
          ].join(" ")}
          style={{
            ["--tab-bg" as string]: PILL_BLUE,
            ["--tab-fg" as string]: "#FFFFFF",
            ["--tab-hover-bg" as string]: "#FFFFFF",
            ["--tab-hover-fg" as string]: PILL_BLUE,
            textDecoration: "none",
          }}
        >
          <span>#{String(alterEgo)}</span>
        </Link>
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
    borderColor: releaseColor ?? archivedReleaseColor,
    borderWidth: "4px",
  };
  const resolvedReleaseColor = releaseColor ?? archivedReleaseColor;
  const tabStyle: CSSProperties = {
    outlineColor: resolvedReleaseColor,
    textDecoration: "none",
    ["--tab-bg" as string]: resolvedReleaseColor,
    ["--tab-fg" as string]:
      resolvedReleaseColor === PILL_CREAM_CITY ? PILL_BLACK : "#FFFFFF",
    ["--tab-hover-bg" as string]:
      resolvedReleaseColor === PILL_CREAM_CITY ? PILL_BLACK : "#FFFFFF",
    ["--tab-hover-fg" as string]:
      resolvedReleaseColor === PILL_CREAM_CITY ? PILL_CREAM_CITY : PILL_BLUE,
    borderColor: resolvedReleaseColor,
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  };

  return (
    <>
      <div
        className="relative rounded-lg border-[4px] px-4 pt-8 pb-4"
        style={borderStyle}
      >
        {releaseName || releaseId ? (
          <Link
            href={`/mark2/shaolin-scrolls/${releaseId}`}
            prefetch={false}
            className={[
              "absolute -top-[4px] left-[-4px] inline-flex items-center gap-1 rounded-tl-lg rounded-tr-md border-[4px] border-b-0 px-3 py-1 text-sm font-semibold leading-none",
              pillInteractionClasses,
            ].join(" ")}
            style={tabStyle}
          >
            <span>{releaseName ?? releaseId}</span>
            <span aria-hidden="true">{"\u203a"}</span>
          </Link>
        ) : null}
        {baseContent}
      </div>
    </>
  );
}
