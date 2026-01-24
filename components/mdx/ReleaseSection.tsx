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

/*
Spike note (ReleaseSection styling)
- release_type → border colors: we reuse badge maps (e.g., planned → Great Lakes Blue, wax → Topps Chrome foil) and parse the badge bg classes into hex values, so the border and tab always align with badge semantics.
- Source of truth: BADGE_VARIANTS already centralizes palette + tokens across the app; using it here prevents divergence between badges, tabs, and list/table views.
- Tab integration: the tab sits inside the container with 4px borders; right border is removed and radii flattened on the right edge so it visually fuses with the parent border while still being a link.
- Rejected: hard-coded color map for ReleaseSection (would drift from badges) and pseudo-element overlays for the tab (added complexity and layering issues).
*/

type ReleaseSectionBaseProps = {
  alterEgo: string;
  children: ReactNode;
  divider?: boolean;
};

type ReleaseSectionWithReleaseId = ReleaseSectionBaseProps & {
  releaseId: string;
  tcdbTradeId?: never;
  tcdbTradePartner?: never;
};

type ReleaseSectionWithTcdbTrade = ReleaseSectionBaseProps & {
  tcdbTradeId: string;
  tcdbTradePartner?: string;
  releaseId?: never;
};

type ReleaseSectionWithoutRelease = ReleaseSectionBaseProps & {
  releaseId?: undefined;
  tcdbTradeId?: undefined;
  tcdbTradePartner?: undefined;
};

type ReleaseSectionProps =
  | ReleaseSectionWithReleaseId
  | ReleaseSectionWithTcdbTrade
  | ReleaseSectionWithoutRelease;

const RELEASE_TYPE_VARIANTS: Record<string, BadgeVariant> = {
  hotfix: "hotfix",
  patch: "hotfix",
  minor: "minor",
  major: "major",
  planned: "planned",
  released: "released",
  chore: "chore",
  classic: "classic",
  year: "year",
  tcdb: "tcdb",
  wax: "wax",
};

const COLOR_OVERRIDES: Record<string, string> = {
  "brand-bucksGreen": "#00471B",
  "brand-creamCityCream": "#EEE1C6",
  "brand-greatLakesBlue": "#0077C0",
  "var(--tc-chrome-foil)": "#AEB4BD",
  "var(--tc-chrome-silver)": "#D6D9DE",
  "var(--tc-chrome-hi)": "#F7F9FC",
  "var(--tc-chrome-mid)": "#D6D9DE",
  "var(--tc-chrome-lo)": "#AEB4BD",
  "var(--tc-chrome-shadow)": "#7E8792",
  "var(--ink)": "#0C1B0C",
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
/**
 * ReleaseSection wraps MDX content with alter-ego tagging and optional release metadata.
 *
 * - alterEgo: required persona tag rendered as a pill.
 * - releaseId: optional scroll ID; when present, the section renders a release-colored border and a linked tab to `/mark2/shaolin-scrolls/{releaseId}` with hover inversion.
 * - tcdbTradeId: optional trade ID; when present, the section renders a release-colored border with a linked tab to the TCDB transaction.
 * - tcdbTradePartner: optional trade partner for TCDB trades.
 * - Visual: default is plain content; with releaseId, a colored container and tab appear while the inner pill stays Great Lakes Blue.
 *
 * @example
 * ```mdx
 * <ReleaseSection alterEgo="mark2" releaseId="86">
 *   This section references release 86.
 * </ReleaseSection>
 * ```
 */
export default async function ReleaseSection({
  alterEgo,
  children,
  divider = true,
  releaseId,
  tcdbTradeId,
  tcdbTradePartner,
}: ReleaseSectionProps) {
  let releaseName: string | undefined;
  let releaseType: string | undefined;
  let tradeUrl: string | undefined;
  let tradePartnerUrl: string | undefined;
  let tabLabel: string | undefined;

  if (releaseId && tcdbTradeId) {
    throw new Error(
      "ReleaseSection: pass either releaseId or tcdbTradeId, not both.",
    );
  }

  if (tcdbTradeId) {
    releaseType = "tcdb";
    tradeUrl = `https://www.tcdb.com/Transactions.cfm?MODE=VIEW&TransactionID=${tcdbTradeId}&PageIndex=1`;
    tradePartnerUrl = tcdbTradePartner
      ? `https://www.tcdb.com/Profile.cfm/${encodeURIComponent(
          tcdbTradePartner,
        )}`
      : undefined;
    tabLabel = `TCDb Trade: ${tcdbTradeId}${
      tradePartnerUrl ? `; Partner ${tcdbTradePartner}` : ""
    }`;
  } else if (releaseId) {
    const release = await getScroll(releaseId);
    releaseName = release?.release_name;
    releaseType = release?.release_type;
    tabLabel = releaseName ?? releaseId;
  }

  const normalizedReleaseType = releaseType?.toLowerCase();
  const showReleaseDetails = Boolean(releaseId || tcdbTradeId);
  const isTcdbTrade = Boolean(tcdbTradeId);
  const releaseColor = showReleaseDetails
    ? getReleaseTypeColor(releaseType)
    : undefined;
  const releaseTextColor = showReleaseDetails
    ? getReleaseTypeTextColor(releaseType)
    : undefined;
  const resolvedReleaseColor = showReleaseDetails
    ? (releaseColor ?? archivedReleaseColor)
    : undefined;
  const resolvedReleaseTextColor = showReleaseDetails
    ? (releaseTextColor ?? archivedTextColor)
    : undefined;
  const isCreamCity = resolvedReleaseColor === PILL_CREAM_CITY;
  const isChromeFoil = normalizedReleaseType === "wax";
  const chromeHoverBackground =
    COLOR_OVERRIDES["var(--tc-chrome-hi)"] ?? "#F7F9FC";
  const tabForegroundColor = isCreamCity
    ? PILL_BLACK
    : resolvedReleaseTextColor;
  const hoverBackgroundColor =
    showReleaseDetails && resolvedReleaseColor
      ? isCreamCity
        ? PILL_BLACK
        : isChromeFoil
          ? chromeHoverBackground
          : "#FFFFFF"
      : "#FFFFFF";
  const hoverForegroundColor =
    showReleaseDetails && resolvedReleaseColor
      ? isCreamCity
        ? PILL_CREAM_CITY
        : isChromeFoil
          ? resolvedReleaseTextColor
          : resolvedReleaseColor
      : PILL_BLUE;
  const tagBackgroundColor =
    showReleaseDetails && resolvedReleaseColor
      ? resolvedReleaseColor
      : PILL_BLUE;
  const tagForegroundColor =
    showReleaseDetails && resolvedReleaseTextColor
      ? resolvedReleaseTextColor
      : "#FFFFFF";
  const tabHref = releaseId ? `/mark2/shaolin-scrolls/${releaseId}` : tradeUrl;
  const resolvedReleaseName = tcdbTradeId
    ? tabLabel
    : (releaseName ?? undefined);
  const showTradePartner = Boolean(tcdbTradeId && tcdbTradePartner);
  const footerClassName = showTradePartner
    ? "flex justify-between items-center"
    : "flex justify-end";

  const baseContent = (
    <div
      className="space-y-3"
      data-release-name={resolvedReleaseName ?? undefined}
      data-release-type={releaseType ?? undefined}
      data-release-color={releaseColor}
      data-release-text-color={releaseTextColor}
      style={
        resolvedReleaseColor
          ? ({
              ["--mdx-divider-color" as string]: resolvedReleaseColor,
              ["--mdx-marker-color" as string]: resolvedReleaseColor,
            } satisfies CSSProperties)
          : undefined
      }
    >
      {children}
      <div className={footerClassName}>
        {showTradePartner && tradePartnerUrl ? (
          <div className="text-sm">
            <span>Trade Partner: </span>
            <Link href={tradePartnerUrl} className="link-blue">
              {tcdbTradePartner}
            </Link>
          </div>
        ) : null}
        <Link
          href={`/shaolin/tags/${encodeURIComponent(alterEgo.toLowerCase())}`}
          prefetch={false}
          className={[
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold leading-none",
            pillInteractionClasses,
            isChromeFoil ? "chrome-foil-shimmer" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ["--tab-bg" as string]: tagBackgroundColor,
            ["--tab-fg" as string]: tagForegroundColor,
            ["--tab-hover-bg" as string]: hoverBackgroundColor,
            ["--tab-hover-fg" as string]: hoverForegroundColor,
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
  const tabStyle: CSSProperties = {
    outlineColor: resolvedReleaseColor,
    textDecoration: "none",
    ["--tab-bg" as string]: resolvedReleaseColor,
    ["--tab-fg" as string]: tabForegroundColor,
    ["--tab-hover-bg" as string]: hoverBackgroundColor,
    ["--tab-hover-fg" as string]: hoverForegroundColor,
    borderColor: resolvedReleaseColor,
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  };

  const releaseContainerClassName = [
    "relative rounded-lg border-[4px] px-4 pt-8 pb-4",
    isChromeFoil ? "chrome-foil-border" : "",
    divider ? "mb-10" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={releaseContainerClassName} style={borderStyle}>
        {tabLabel && tabHref ? (
          <Link
            href={tabHref}
            prefetch={false}
            target={isTcdbTrade ? "_blank" : undefined}
            rel={isTcdbTrade ? "noreferrer noopener" : undefined}
            className={[
              "absolute -top-[4px] left-[-4px] inline-flex items-center gap-1 rounded-tl-lg rounded-tr-md border-[4px] border-b-0 px-3 py-1 text-sm font-semibold leading-none",
              pillInteractionClasses,
              isChromeFoil ? "chrome-foil-shimmer" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={tabStyle}
          >
            <span>{tabLabel}</span>
            <span aria-hidden="true">{"\u203a"}</span>
          </Link>
        ) : null}
        {baseContent}
      </div>
    </>
  );
}
