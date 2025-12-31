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

const archivedReleaseColor =
  parseBadgeBackgroundColor(BADGE_VARIANTS.archived) ?? "#EEE1C6";

function getBadgeBackgroundColor(variant: BadgeVariant): string {
  return (
    parseBadgeBackgroundColor(BADGE_VARIANTS[variant]) ?? archivedReleaseColor
  );
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

  const baseContent = (
    <div
      className="space-y-3"
      data-release-name={releaseName ?? undefined}
      data-release-type={releaseType ?? undefined}
      data-release-color={releaseColor}
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

  const borderStyle = releaseColor ? { borderColor: releaseColor } : undefined;
  const tabStyle = releaseColor
    ? { backgroundColor: releaseColor, borderColor: releaseColor }
    : undefined;

  return (
    <>
      <div
        className="relative rounded-lg border px-4 pt-6 pb-4"
        style={borderStyle}
      >
        {releaseName || releaseId ? (
          <span
            className="absolute -top-[1px] left-0 inline-flex items-center rounded-tr-md border border-b-0 px-3 py-1 text-sm font-semibold leading-none"
            style={tabStyle}
          >
            {releaseName ?? releaseId}
          </span>
        ) : null}
        {baseContent}
      </div>
      {divider ? (
        <hr className="my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]" />
      ) : null}
    </>
  );
}
