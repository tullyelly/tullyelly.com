import TagLink from "@/components/tags/TagLink";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import PersonTag from "@/components/mdx/PersonTag";
import {
  PILL_BLUE,
  PILL_BLACK,
  PILL_CREAM_CITY,
  pillInteractionClasses,
} from "@/components/ui/pillStyles";
import { getBricksSummaryFromDb } from "@/lib/bricks-db";
import { getReviewSummaryFromDb } from "@/lib/review-db";
import {
  formatBricksReviewScore as formatNormalizedBricksReviewScore,
  normalizeBricksPublicId,
} from "@/lib/bricks-types";
import { getLcsSummaryFromDb } from "@/lib/lcs-db";
import { normalizeLcsSlug } from "@/lib/lcs-types";
import { REVIEW_TYPE_CONFIG, type ReviewType } from "@/lib/review-types";
import { getScroll } from "@/lib/scrolls";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";
import { getTcdbTradeSummaryFromDb } from "@/lib/tcdb-trade-db";
import { getUspsSummaryFromDb, normalizeUspsCitySlug } from "@/lib/usps-db";
import {
  getVolleyballTournamentDayByKeyAndDate,
  normalizeVolleyballTournamentDate,
  normalizeVolleyballTournamentKey,
} from "@/lib/volleyball-tournament-db";
import { formatVolleyballTournamentFinish } from "@/lib/volleyball-finish";
import { getReleaseSectionAnchorId } from "@/lib/release-section-anchor";

/*
Spike note (ReleaseSection styling)
- Color source: border, tab, divider, bullets, and pills all resolve from the
  rainbow assignment value passed to `rainbowColour`.
- Ribbon integration: the header stays in normal flow and meets the container border, so wrapped labels reserve their own space.
- Rejected: release-type palette branching and ad hoc per-section color maps.
*/

export type ReviewProps = {
  type: ReviewType;
  id: string | number;
  name?: string;
  url?: string;
  rating?: string | number;
};

export type BricksIdentifier =
  | string
  | number
  | {
      id: string | number;
      name?: string;
      tag?: string;
      pieceCount?: string | number;
      reviewScore?: string | number;
    };

const TOURNAMENT_TROPHY_ICON_SRC = "/images/optimus/ccvbc-trophy.webp";

type ReleaseSectionBaseProps = {
  alterEgo: string;
  children: ReactNode;
  divider?: boolean;
  rainbowColour?: string;
  tournamentId?: string | number;
  tournamentDate?: string;
  guestMage?: string;
  /** Assigned by the full chronicle renderer from source order. */
  sectionOrdinal?: number;
};

type ReleaseSectionWithReleaseId = ReleaseSectionBaseProps & {
  releaseId: string;
  tcdbTradeId?: never;
  review?: never;
  bricks?: never;
  usps?: string;
  lcs?: string;
};

type ReleaseSectionWithTcdbTrade = ReleaseSectionBaseProps & {
  tcdbTradeId: string;
  releaseId?: never;
  review?: never;
  bricks?: never;
  usps?: never;
  lcs?: never;
};

type ReleaseSectionWithReview = ReleaseSectionBaseProps & {
  review: ReviewProps;
  releaseId?: never;
  tcdbTradeId?: never;
  bricks?: never;
  usps?: never;
  lcs?: never;
};

type ReleaseSectionWithBricks = ReleaseSectionBaseProps & {
  bricks: BricksIdentifier;
  releaseId?: never;
  tcdbTradeId?: never;
  review?: never;
  usps?: never;
  lcs?: never;
};

type ReleaseSectionWithUsps = ReleaseSectionBaseProps & {
  usps: string;
  releaseId?: never;
  tcdbTradeId?: never;
  review?: never;
  bricks?: never;
  lcs?: never;
};

type ReleaseSectionWithLcs = ReleaseSectionBaseProps & {
  lcs: string;
  releaseId?: never;
  tcdbTradeId?: never;
  review?: never;
  bricks?: never;
  usps?: never;
};

type ReleaseSectionWithoutReleaseReviewOrBricks = ReleaseSectionBaseProps & {
  review?: undefined;
  releaseId?: undefined;
  tcdbTradeId?: undefined;
  bricks?: undefined;
  usps?: undefined;
  lcs?: undefined;
};

type ReleaseSectionProps =
  | ReleaseSectionWithReleaseId
  | ReleaseSectionWithTcdbTrade
  | ReleaseSectionWithReview
  | ReleaseSectionWithBricks
  | ReleaseSectionWithUsps
  | ReleaseSectionWithLcs
  | ReleaseSectionWithoutReleaseReviewOrBricks;

function getReadableTextColor(backgroundColor: string): string {
  const normalized = backgroundColor.replace(/^#/, "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return "#000000";
  }

  const value = Number.parseInt(fullHex, 16);
  if (Number.isNaN(value)) return "#000000";

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const yiq = (red * 299 + green * 587 + blue * 114) / 1000;

  return yiq >= 140 ? "#000000" : "#FFFFFF";
}

function getReviewLabel(type: ReviewType): string {
  return REVIEW_TYPE_CONFIG[type].singularLabel;
}

function toOptionalText(
  value: string | number | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function formatBricksReviewScoreOverride(
  value: string | number | undefined,
): string | undefined {
  const normalized = toOptionalText(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return formatNormalizedBricksReviewScore(parsed);
}

function getBricksReferenceUrl(publicId: string): string {
  return `https://www.lego.com/en-ch/service/building-instructions/${encodeURIComponent(
    publicId,
  )}`;
}

// ReleaseSection preserves authored MDX content and closes it with persona metadata.
/**
 * ReleaseSection wraps MDX content with alter-ego tagging and optional release metadata.
 *
 * - alterEgo: required persona tag rendered as a pill.
 * - releaseId: optional scroll ID; when present, the section renders a linked tab to `/mark2/shaolin-scrolls/{releaseId}`.
 * - tcdbTradeId: optional trade ID; when present, the section renders a linked tab to `/cardattack/tcdb-trades/{tcdbTradeId}`.
 * - TCDb trade partner, aggregate card traffic, and completion state are resolved from the DB-backed trade metadata.
 * - tournamentId: optional stable external volleyball tournament key; when present it must be paired with tournamentDate.
 * - tournamentDate: optional ISO tournament date in YYYY-MM-DD form; when present it must be paired with tournamentId.
 * - Volleyball metadata is DB-backed; ReleaseSection resolves tournamentName and reconstructs the W-L record from dojo.volleyball_tournament + dojo.volleyball_tournament_day.
 * - TCDb metadata is DB-backed; ReleaseSection resolves aggregate card counts and completion state from dojo.tcdb_trade + dojo.tcdb_trade_day while preserving tcdbTradeId as the public route key.
 * - guestMage: optional guest writer label rendered as a stamp.
 * - review: optional unified review metadata for shared review families such as table schema, save point, or golden age; must not be combined with releaseId or tcdbTradeId.
 * - bricks: optional bricks metadata for subset-backed build features such as LEGO; must not be combined with releaseId, tcdbTradeId, or review.
 * - usps: optional USPS city slug that links the section to the DB-backed cardattack USPS route and resolves the USPS total visit count; it may be combined with releaseId, but must not be combined with tcdbTradeId, review, or bricks.
 * - lcs: optional local card shop slug that links the section to the DB-backed cardattack LCS route and resolves the shop summary metadata; it may be combined with releaseId, but must not be combined with tcdbTradeId, review, bricks, or usps.
 * - rainbowColour: optional rainbow assignment colour; when present, it is the only colour source for section accents, including release-linked sections.
 * - Visual: default is plain content; with releaseId/tcdbTradeId, a bordered container and tab appear using the rainbow assignment colour.
 *
 * @example
 * ```mdx
 * <ReleaseSection alterEgo="mark2" releaseId="86">
 *   This section references release 86.
 * </ReleaseSection>
 * ```
 */
export default async function ReleaseSection(props: ReleaseSectionProps) {
  const { review, bricks, usps, lcs } = props;
  const {
    alterEgo,
    children,
    divider,
    releaseId,
    tcdbTradeId,
    tournamentId,
    tournamentDate,
    guestMage,
    rainbowColour,
    sectionOrdinal,
  } = props;
  let releaseName: string | undefined;
  let releaseType: string | undefined;
  let releaseSummary: Awaited<ReturnType<typeof getScroll>> = null;
  let tradeUrl: string | undefined;
  let tradePartnerUrl: string | undefined;
  let tabLabel: string | undefined;
  let reviewSummary: Awaited<ReturnType<typeof getReviewSummaryFromDb>> = null;
  let resolvedReviewName: string | undefined;
  let resolvedReviewUrl: string | undefined;
  let resolvedReviewRating: string | undefined;
  let resolvedBricksPublicId: string | undefined;
  let resolvedBricksName: string | undefined;
  let resolvedBricksTag: string | undefined;
  let resolvedBricksPieceCount: string | undefined;
  let resolvedBricksReviewScore: string | undefined;
  let resolvedBricksRoute: string | undefined;
  let resolvedBricksReferenceUrl: string | undefined;
  let resolvedUspsCitySlug: string | undefined;
  let resolvedUspsName: string | undefined;
  let resolvedUspsRating: string | undefined;
  let resolvedUspsRoute: string | undefined;
  let resolvedUspsVisitCount: number | undefined;
  let resolvedLcsSlug: string | undefined;
  let resolvedLcsName: string | undefined;
  let resolvedLcsCity: string | undefined;
  let resolvedLcsState: string | undefined;
  let resolvedLcsRating: string | undefined;
  let resolvedLcsRoute: string | undefined;
  let resolvedLcsVisitCount: number | undefined;
  let resolvedLcsUrl: string | undefined;

  if (releaseId && tcdbTradeId) {
    throw new Error(
      "ReleaseSection: pass either releaseId or tcdbTradeId, not both.",
    );
  }

  if (releaseId && review) {
    throw new Error(
      "ReleaseSection: pass either releaseId or review, not both.",
    );
  }

  if (tcdbTradeId && review) {
    throw new Error(
      "ReleaseSection: pass either tcdbTradeId or review, not both.",
    );
  }

  if (releaseId && bricks) {
    throw new Error(
      "ReleaseSection: pass either releaseId or bricks, not both.",
    );
  }

  if (tcdbTradeId && bricks) {
    throw new Error(
      "ReleaseSection: pass either tcdbTradeId or bricks, not both.",
    );
  }

  if (review && bricks) {
    throw new Error("ReleaseSection: pass either review or bricks, not both.");
  }

  if (tcdbTradeId && usps) {
    throw new Error(
      "ReleaseSection: pass either tcdbTradeId or usps, not both.",
    );
  }

  if (review && usps) {
    throw new Error("ReleaseSection: pass either review or usps, not both.");
  }

  if (bricks && usps) {
    throw new Error("ReleaseSection: pass either bricks or usps, not both.");
  }

  if (tcdbTradeId && lcs) {
    throw new Error(
      "ReleaseSection: pass either tcdbTradeId or lcs, not both.",
    );
  }

  if (review && lcs) {
    throw new Error("ReleaseSection: pass either review or lcs, not both.");
  }

  if (bricks && lcs) {
    throw new Error("ReleaseSection: pass either bricks or lcs, not both.");
  }

  if (usps && lcs) {
    throw new Error("ReleaseSection: pass either usps or lcs, not both.");
  }

  reviewSummary = review
    ? await getReviewSummaryFromDb(review.type, review.id)
    : null;
  resolvedReviewName =
    review?.name?.trim() ||
    reviewSummary?.name ||
    (review ? String(review.id).trim() : undefined);
  resolvedReviewUrl = review?.url?.trim() || reviewSummary?.url;
  resolvedReviewRating =
    review?.rating !== undefined && `${review.rating}`.trim() !== ""
      ? String(review.rating)
      : reviewSummary?.averageRating !== undefined
        ? `${reviewSummary.averageRating.toFixed(1)}/10`
        : undefined;

  const bricksId =
    typeof bricks === "string" || typeof bricks === "number"
      ? bricks
      : bricks?.id;
  const bricksSummary = bricksId
    ? await getBricksSummaryFromDb("lego", bricksId)
    : null;
  resolvedBricksPublicId = bricksId
    ? normalizeBricksPublicId(bricksId)
    : undefined;
  resolvedBricksName =
    (typeof bricks === "object" ? toOptionalText(bricks.name) : undefined) ||
    bricksSummary?.setName ||
    resolvedBricksPublicId ||
    undefined;
  resolvedBricksTag =
    typeof bricks === "object"
      ? toOptionalText(bricks.tag) || bricksSummary?.tag
      : bricksSummary?.tag;
  resolvedBricksPieceCount =
    typeof bricks === "object"
      ? toOptionalText(bricks.pieceCount) ||
        (bricksSummary?.pieceCount !== undefined
          ? String(bricksSummary.pieceCount)
          : undefined)
      : bricksSummary?.pieceCount !== undefined
        ? String(bricksSummary.pieceCount)
        : undefined;
  resolvedBricksReviewScore =
    typeof bricks === "object"
      ? formatBricksReviewScoreOverride(bricks.reviewScore) ||
        (bricksSummary?.reviewScore !== undefined
          ? formatNormalizedBricksReviewScore(bricksSummary.reviewScore)
          : undefined)
      : bricksSummary?.reviewScore !== undefined
        ? formatNormalizedBricksReviewScore(bricksSummary.reviewScore)
        : undefined;
  resolvedBricksRoute = resolvedBricksPublicId
    ? `/unclejimmy/bricks/${encodeURIComponent(resolvedBricksPublicId)}`
    : undefined;
  resolvedBricksReferenceUrl = resolvedBricksPublicId
    ? getBricksReferenceUrl(resolvedBricksPublicId)
    : undefined;
  resolvedUspsCitySlug = usps ? normalizeUspsCitySlug(usps) : undefined;
  const uspsSummary = resolvedUspsCitySlug
    ? await getUspsSummaryFromDb(resolvedUspsCitySlug)
    : null;
  resolvedUspsName = uspsSummary
    ? `${uspsSummary.cityName}, ${uspsSummary.state}`
    : toOptionalText(usps) || resolvedUspsCitySlug;
  resolvedUspsRating =
    uspsSummary?.rating !== undefined
      ? `${uspsSummary.rating.toFixed(1)}/10`
      : undefined;
  resolvedUspsVisitCount = uspsSummary?.visitCount;
  resolvedUspsRoute = resolvedUspsCitySlug
    ? `/cardattack/usps/${encodeURIComponent(resolvedUspsCitySlug)}`
    : undefined;
  if (lcs !== undefined) {
    try {
      resolvedLcsSlug = normalizeLcsSlug(lcs);
    } catch {
      throw new Error(
        "ReleaseSection: lcs must be a non-empty string or number.",
      );
    }
  }
  const lcsSummary = resolvedLcsSlug
    ? await getLcsSummaryFromDb(resolvedLcsSlug)
    : null;
  resolvedLcsName = lcsSummary?.name || resolvedLcsSlug;
  resolvedLcsCity = lcsSummary?.city;
  resolvedLcsState = lcsSummary?.state;
  resolvedLcsRating =
    lcsSummary?.rating !== undefined
      ? `${lcsSummary.rating.toFixed(1)}/10`
      : undefined;
  resolvedLcsVisitCount = lcsSummary?.visitCount;
  resolvedLcsUrl = lcsSummary?.url;
  resolvedLcsRoute = resolvedLcsSlug
    ? `/cardattack/lcs/${encodeURIComponent(resolvedLcsSlug)}`
    : undefined;

  const hasTournamentId = tournamentId !== undefined;
  const hasTournamentDate = tournamentDate !== undefined;

  if (hasTournamentId && !hasTournamentDate) {
    throw new Error(
      "ReleaseSection: tournamentDate is required when tournamentId is provided.",
    );
  }

  if (hasTournamentDate && !hasTournamentId) {
    throw new Error(
      "ReleaseSection: tournamentId is required when tournamentDate is provided.",
    );
  }

  let resolvedTournamentKey: string | undefined;
  let resolvedTournamentDate: string | undefined;
  let resolvedTournamentName: string | undefined;
  let resolvedTournamentRecord: string | undefined;
  let resolvedTournamentFinish: number | null | undefined;

  if (hasTournamentId && hasTournamentDate) {
    try {
      resolvedTournamentKey = normalizeVolleyballTournamentKey(
        String(tournamentId),
      );
    } catch {
      throw new Error(
        "ReleaseSection: tournamentId must be a non-empty string or number.",
      );
    }

    try {
      resolvedTournamentDate =
        normalizeVolleyballTournamentDate(tournamentDate);
    } catch {
      throw new Error(
        "ReleaseSection: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
      );
    }

    const tournamentDay = await getVolleyballTournamentDayByKeyAndDate(
      resolvedTournamentKey,
      resolvedTournamentDate,
    );

    if (tournamentDay) {
      resolvedTournamentKey = tournamentDay.tournamentKey;
      resolvedTournamentDate = tournamentDay.tournamentDate;
      resolvedTournamentName = tournamentDay.tournamentName;
      resolvedTournamentRecord = `${tournamentDay.wins}-${tournamentDay.losses}`;
      resolvedTournamentFinish = tournamentDay.finish;
    }
  }

  const tcdbTradeSummary = tcdbTradeId
    ? await getTcdbTradeSummaryFromDb(tcdbTradeId)
    : null;
  const resolvedTradePartner = tcdbTradeSummary?.partner;
  const resolvedTradePartnerId = tcdbTradeSummary?.tradePartnerId;
  const resolvedTradeReceived = tcdbTradeSummary?.received;
  const resolvedTradeSent = tcdbTradeSummary?.sent;
  const resolvedTradeTotal = tcdbTradeSummary?.total;

  if (tcdbTradeId) {
    releaseType = "tcdb";
    tradeUrl = `/cardattack/tcdb-trades/${tcdbTradeId}`;
    tradePartnerUrl = resolvedTradePartnerId
      ? `/cardattack/tcdb-trade-partners/${resolvedTradePartnerId}`
      : undefined;
    tabLabel = `TCDb Trade: ${tcdbTradeId}`;
  } else if (releaseId) {
    const release = await getScroll(releaseId);
    releaseSummary = release;
    releaseName = release?.release_name;
    releaseType = release?.release_type;
    tabLabel = releaseName ?? releaseId;
  }

  let completedLabel: string | undefined;
  let completedHref: string | undefined;

  if (tcdbTradeId && tcdbTradeSummary) {
    const shouldShowCompletion =
      tcdbTradeSummary.sectionCount > 1 &&
      tcdbTradeSummary.status === "Completed";

    if (shouldShowCompletion) {
      completedLabel = "Completed";
      completedHref = `/cardattack/tcdb-trades/${tcdbTradeId}`;
    }
  }

  const showTournament = Boolean(
    resolvedTournamentName && resolvedTournamentRecord,
  );
  const showTournamentUnavailable = Boolean(
    resolvedTournamentKey && resolvedTournamentDate && !showTournament,
  );
  const showReleaseDetails = Boolean(releaseId || tcdbTradeId);
  const showTournamentVisuals =
    (showTournament || showTournamentUnavailable) && !showReleaseDetails;
  const tournamentFinishLabel = formatVolleyballTournamentFinish(
    resolvedTournamentFinish ?? null,
  );
  const showReviewVisuals = Boolean(review);
  const shouldRenderReview = showReviewVisuals && !showReleaseDetails;
  const showBricksVisuals = Boolean(bricks);
  const shouldRenderBricks = showBricksVisuals && !showReleaseDetails;
  const showReviewRating = resolvedReviewRating !== undefined;
  const reviewLabel = review ? getReviewLabel(review.type) : undefined;
  const showBricksMetadataRow = Boolean(
    resolvedBricksPublicId || resolvedBricksPieceCount || resolvedBricksTag,
  );
  const showUspsVisuals = Boolean(usps);
  const shouldRenderUsps = showUspsVisuals;
  const resolvedUspsVisitLabel =
    resolvedUspsVisitCount === undefined
      ? undefined
      : `${resolvedUspsVisitCount} ${
          resolvedUspsVisitCount === 1 ? "visit" : "visits"
        }`;
  const resolvedLcsLocation = [resolvedLcsCity, resolvedLcsState]
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const resolvedLcsDisplayName =
    resolvedLcsName && resolvedLcsLocation
      ? `${resolvedLcsName}; ${resolvedLcsLocation}`
      : resolvedLcsName;
  const showLcsVisuals = Boolean(lcs);
  const shouldRenderLcs = showLcsVisuals;
  const hasPlainVisualContainer =
    showTournamentVisuals ||
    showUspsVisuals ||
    showLcsVisuals ||
    showBricksVisuals ||
    showReviewVisuals;
  const effectiveDivider =
    divider ?? (showReleaseDetails || hasPlainVisualContainer);
  const resolvedLcsVisitLabel =
    resolvedLcsVisitCount === undefined
      ? undefined
      : `${resolvedLcsVisitCount} ${resolvedLcsVisitCount === 1 ? "visit" : "visits"}`;
  // Rainbow assignment is the only accent colour source for ReleaseSection.
  const normalizedRainbowColour = rainbowColour?.trim() || PILL_BLUE;
  const resolvedSectionColor = normalizedRainbowColour;
  const resolvedSectionTextColor = getReadableTextColor(resolvedSectionColor);
  const isCreamCity = resolvedSectionColor === PILL_CREAM_CITY;
  const tabForegroundColor = isCreamCity
    ? PILL_BLACK
    : resolvedSectionTextColor;
  const hoverBackgroundColor = resolvedSectionColor
    ? isCreamCity
      ? PILL_BLACK
      : "#FFFFFF"
    : "#FFFFFF";
  const hoverForegroundColor = resolvedSectionColor
    ? isCreamCity
      ? PILL_CREAM_CITY
      : resolvedSectionColor
    : PILL_BLUE;
  const tagBackgroundColor = resolvedSectionColor;
  const tagForegroundColor = resolvedSectionTextColor;
  const tabHref = releaseId ? `/mark2/shaolin-scrolls/${releaseId}` : tradeUrl;
  const resolvedReleaseName = tcdbTradeId
    ? `TCDb Trade: ${tcdbTradeId}${resolvedTradePartner ? `; Partner ${resolvedTradePartner}` : ""}`
    : (releaseName ?? undefined);
  const guestMageStamp = guestMage?.trim();
  const showTradePartner = Boolean(tcdbTradeId && resolvedTradePartner);
  const showTradeCardCounts = Boolean(
    tcdbTradeId && resolvedTradeTotal !== undefined,
  );
  const showTournamentFinishFooter = Boolean(tournamentFinishLabel);
  const tournamentFinishHasTrophy = resolvedTournamentFinish === 1;
  const tournamentFinishClassName = tournamentFinishHasTrophy
    ? "inline-flex items-center justify-center gap-3 rounded-full border border-[var(--cream)] bg-black pl-2.5 pr-4 py-2 text-sm font-semibold text-[var(--cream)] shadow-sm"
    : "inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-muted-foreground";
  const alterEgoTag = (
    <TagLink
      tag={alterEgo}
      prefetch={false}
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold leading-none",
        pillInteractionClasses,
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
    </TagLink>
  );

  // Release identity takes precedence; supplemental identities stay with their metadata.
  const tournamentIsPrimary =
    !showReleaseDetails && !review && !bricks && !usps && !lcs;
  const headerLabel = tabLabel ?? (review ? reviewLabel : undefined);
  const headerSubject = showReleaseDetails
    ? undefined
    : review
      ? resolvedReviewName
      : bricks
        ? resolvedBricksName
        : usps
          ? resolvedUspsName
          : lcs
            ? resolvedLcsName
            : (resolvedTournamentName ??
              (resolvedTournamentKey
                ? `Tournament ${resolvedTournamentKey}`
                : undefined));
  const headerHref =
    tabHref ??
    (review
      ? resolvedReviewUrl
      : bricks
        ? resolvedBricksRoute
        : usps
          ? resolvedUspsRoute
          : lcs
            ? resolvedLcsRoute
            : undefined);
  const ribbonStyle: CSSProperties = {
    outlineColor: resolvedSectionColor,
    textDecoration: "none",
    ["--tab-bg" as string]: resolvedSectionColor,
    ["--tab-fg" as string]: tabForegroundColor,
    ["--tab-hover-bg" as string]: hoverBackgroundColor,
    ["--tab-hover-fg" as string]: hoverForegroundColor,
    backgroundColor: resolvedSectionColor,
    color: tabForegroundColor,
    borderColor: resolvedSectionColor,
  };
  const ribbonClasses =
    "inline-flex max-w-full items-center gap-2 rounded-br-md border-[4px] border-t-0 border-l-0 px-3 py-2 text-sm font-semibold leading-snug";
  const ribbonContent = (
    <>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {headerLabel}
        {review && headerSubject ? ": " : null}
        {headerSubject ? <span>{headerSubject}</span> : null}
      </span>
      {headerHref ? (
        <span className="shrink-0" aria-hidden="true">
          {"\u203a"}
        </span>
      ) : null}
    </>
  );
  const header =
    headerLabel || headerSubject ? (
      <header data-release-section-header className="-mx-4 -mt-4 mb-4">
        {headerHref ? (
          <Link
            href={headerHref}
            prefetch={false}
            {...(review
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={`${ribbonClasses} ${pillInteractionClasses}`}
            style={ribbonStyle}
          >
            {ribbonContent}
          </Link>
        ) : (
          <div className={ribbonClasses} style={ribbonStyle}>
            {ribbonContent}
          </div>
        )}
      </header>
    ) : null;

  const releaseMetadata: { label: string; value: string }[] = [];
  if (releaseSummary) {
    const release = releaseSummary;
    const headerValue = tabLabel?.trim() ?? "";
    const releaseDate = release.release_date?.trim();
    const items: [string, string | undefined][] = [
      ["Status", release.status?.trim()],
      ["Type", release.release_type?.trim()],
      ["Date", releaseDate ? formatReleaseDate(releaseDate).trim() : undefined],
      ["Release ID", release.id?.trim()],
    ];
    for (const [label, value] of items) {
      if (value && (label !== "Release ID" || value !== headerValue)) {
        releaseMetadata.push({ label, value });
      }
    }
    const displayedValues = new Set(
      [
        headerValue,
        ...(shouldRenderUsps
          ? [resolvedUspsName, resolvedUspsRating, resolvedUspsVisitLabel]
          : []),
        ...(shouldRenderLcs
          ? [
              resolvedLcsDisplayName,
              resolvedLcsName,
              resolvedLcsLocation,
              resolvedLcsRating,
              resolvedLcsVisitLabel,
            ]
          : []),
        ...(showTournament
          ? [
              resolvedTournamentName,
              resolvedTournamentRecord,
              tournamentFinishLabel,
            ]
          : []),
        ...releaseMetadata.map(({ value }) => value),
      ].map((value) => value?.trim()),
    );
    for (const [label, value] of [
      ["Label", release.label?.trim()],
      ["Name", release.release_name?.trim()],
    ] as const) {
      if (value && !displayedValues.has(value)) {
        releaseMetadata.push({ label, value });
        displayedValues.add(value);
      }
    }
  }

  const showUspsFooter = Boolean(
    shouldRenderUsps &&
    resolvedUspsName &&
    (showReleaseDetails || resolvedUspsRating || resolvedUspsVisitLabel),
  );
  const showLcsFooter = Boolean(
    shouldRenderLcs &&
    resolvedLcsDisplayName &&
    (showReleaseDetails ||
      resolvedLcsLocation ||
      resolvedLcsRating ||
      resolvedLcsVisitLabel),
  );
  const showBricksFooter = Boolean(
    shouldRenderBricks &&
    resolvedBricksName &&
    (resolvedBricksReviewScore || showBricksMetadataRow),
  );
  const hasFooterMetadata = Boolean(
    releaseMetadata.length ||
    showTournament ||
    showTournamentUnavailable ||
    showTournamentFinishFooter ||
    (shouldRenderReview && showReviewRating) ||
    showBricksFooter ||
    showUspsFooter ||
    showLcsFooter ||
    showTradeCardCounts ||
    showTradePartner ||
    (completedLabel && completedHref),
  );

  const baseContent = (
    <section
      className="space-y-3"
      data-release-name={resolvedReleaseName ?? undefined}
      data-release-type={releaseType ?? undefined}
      data-release-color={resolvedSectionColor}
      data-release-text-color={resolvedSectionTextColor}
      data-rainbow-colour={normalizedRainbowColour}
      data-tournament-id={resolvedTournamentKey}
      data-tournament-date={resolvedTournamentDate}
      data-tournament-name={resolvedTournamentName}
      data-tournament-record={resolvedTournamentRecord}
      data-tournament-status={
        showTournamentUnavailable ? "unavailable" : undefined
      }
      data-tournament-finish={
        resolvedTournamentFinish !== undefined &&
        resolvedTournamentFinish !== null
          ? String(resolvedTournamentFinish)
          : undefined
      }
      data-review-type={review?.type ?? undefined}
      data-review-id={review !== undefined ? String(review.id) : undefined}
      data-review-name={resolvedReviewName ?? undefined}
      data-review-rating={resolvedReviewRating ?? undefined}
      data-bricks-id={resolvedBricksPublicId ?? undefined}
      data-bricks-name={resolvedBricksName ?? undefined}
      data-bricks-tag={resolvedBricksTag ?? undefined}
      data-bricks-piece-count={resolvedBricksPieceCount ?? undefined}
      data-bricks-review-score={resolvedBricksReviewScore ?? undefined}
      data-bricks-route={resolvedBricksRoute ?? undefined}
      data-usps-id={resolvedUspsCitySlug ?? undefined}
      data-usps-name={resolvedUspsName ?? undefined}
      data-usps-rating={resolvedUspsRating ?? undefined}
      data-usps-visit-count={
        resolvedUspsVisitCount !== undefined
          ? String(resolvedUspsVisitCount)
          : undefined
      }
      data-usps-route={resolvedUspsRoute ?? undefined}
      data-lcs-slug={resolvedLcsSlug ?? undefined}
      data-lcs-name={resolvedLcsName ?? undefined}
      data-lcs-city={resolvedLcsCity ?? undefined}
      data-lcs-state={resolvedLcsState ?? undefined}
      data-lcs-rating={resolvedLcsRating ?? undefined}
      data-lcs-visit-count={
        resolvedLcsVisitCount !== undefined
          ? String(resolvedLcsVisitCount)
          : undefined
      }
      data-lcs-route={resolvedLcsRoute ?? undefined}
      data-lcs-url={resolvedLcsUrl ?? undefined}
      data-tcdb-received={
        resolvedTradeReceived !== undefined
          ? String(resolvedTradeReceived)
          : undefined
      }
      data-tcdb-sent={
        resolvedTradeSent !== undefined ? String(resolvedTradeSent) : undefined
      }
      data-tcdb-total={
        resolvedTradeTotal !== undefined
          ? String(resolvedTradeTotal)
          : undefined
      }
      style={
        resolvedSectionColor
          ? ({
              ["--mdx-divider-color" as string]: resolvedSectionColor,
              ["--mdx-marker-color" as string]: resolvedSectionColor,
            } satisfies CSSProperties)
          : undefined
      }
    >
      {header}
      {guestMageStamp && (
        <div className="flex items-start">
          <Badge className={getBadgeClass("chore")}>
            {`Guest Mage: ${guestMageStamp}`}
          </Badge>
        </div>
      )}
      {children}
      <footer
        data-release-section-footer
        className={`flex flex-col pb-1 sm:flex-row sm:items-center sm:justify-between ${hasFooterMetadata ? "mt-6 gap-4 border-t-2 pt-4" : "mt-3"}`}
        style={{ borderColor: resolvedSectionColor }}
      >
        {hasFooterMetadata ? (
          <div
            data-release-section-metadata
            className="flex min-w-0 flex-1 flex-col items-start gap-x-6 gap-y-2 text-sm [overflow-wrap:anywhere] sm:flex-row sm:flex-wrap sm:items-center [&>*]:max-w-full [&>*]:min-w-0"
          >
            {releaseMetadata.map(({ label, value }) => (
              <div key={label}>{`${label}: ${value}`}</div>
            ))}
            {showTournament ? (
              <>
                {!tournamentIsPrimary ? (
                  <div>{`Tournament: ${resolvedTournamentName}`}</div>
                ) : null}
                <div>{`Record: ${resolvedTournamentRecord}`}</div>
              </>
            ) : null}
            {showTournamentUnavailable ? (
              <div className="text-sm text-muted-foreground">
                {`Volleyball tournament details are unavailable for tournament ${resolvedTournamentKey} on ${resolvedTournamentDate}.`}
              </div>
            ) : null}
            {shouldRenderReview && showReviewRating ? (
              <div>{`Rating: ${resolvedReviewRating}`}</div>
            ) : null}
            {showBricksFooter ? (
              <>
                {resolvedBricksReviewScore ? (
                  <div>{`Rating: ${resolvedBricksReviewScore}`}</div>
                ) : null}
                {resolvedBricksPublicId ? (
                  <div>
                    <span>LEGO ID: </span>
                    {resolvedBricksReferenceUrl ? (
                      <Link
                        href={resolvedBricksReferenceUrl}
                        className="link-blue"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resolvedBricksPublicId}
                      </Link>
                    ) : (
                      <span>{resolvedBricksPublicId}</span>
                    )}
                  </div>
                ) : null}
                {resolvedBricksPieceCount ? (
                  <div>{`Pieces: ${resolvedBricksPieceCount}`}</div>
                ) : null}
                {resolvedBricksTag ? (
                  <div>
                    <span>Tag: </span>
                    <PersonTag
                      tag={resolvedBricksTag}
                      displayName={resolvedBricksTag}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            {showUspsFooter ? (
              <>
                {showReleaseDetails ? (
                  <div>
                    <span>USPS: </span>
                    {resolvedUspsRoute ? (
                      <Link href={resolvedUspsRoute} className="link-blue">
                        {resolvedUspsName}
                      </Link>
                    ) : (
                      <span>{resolvedUspsName}</span>
                    )}
                  </div>
                ) : null}
                {resolvedUspsRating ? (
                  <div>{`Rating: ${resolvedUspsRating}`}</div>
                ) : null}
                {resolvedUspsVisitCount !== undefined ? (
                  <div>{`Visits: ${resolvedUspsVisitCount}`}</div>
                ) : null}
              </>
            ) : null}
            {showLcsFooter ? (
              <>
                {showReleaseDetails ? (
                  <div>
                    <span>Shop: </span>
                    {resolvedLcsRoute ? (
                      <Link href={resolvedLcsRoute} className="link-blue">
                        {resolvedLcsName}
                      </Link>
                    ) : (
                      <span>{resolvedLcsName}</span>
                    )}
                  </div>
                ) : null}
                {resolvedLcsLocation ? (
                  <div>{`Location: ${resolvedLcsLocation}`}</div>
                ) : null}
                {resolvedLcsRating ? (
                  <div>{`Rating: ${resolvedLcsRating}`}</div>
                ) : null}
                {resolvedLcsVisitCount !== undefined ? (
                  <div>{`Visits: ${resolvedLcsVisitCount}`}</div>
                ) : null}
              </>
            ) : null}
            {showTradeCardCounts ? (
              <>
                {resolvedTradeTotal !== undefined ? (
                  <div>{`Total: ${resolvedTradeTotal}`}</div>
                ) : null}
                {resolvedTradeSent !== undefined ? (
                  <div>{`Sent: ${resolvedTradeSent}`}</div>
                ) : null}
                {resolvedTradeReceived !== undefined ? (
                  <div>{`Received: ${resolvedTradeReceived}`}</div>
                ) : null}
              </>
            ) : null}
            {showTournamentFinishFooter ? (
              <div className={tournamentFinishClassName}>
                {tournamentFinishHasTrophy ? (
                  <Image
                    src={TOURNAMENT_TROPHY_ICON_SRC}
                    alt=""
                    aria-hidden="true"
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0"
                  />
                ) : null}
                <span className="leading-none">
                  Finish: <span>{tournamentFinishLabel}</span>
                </span>
              </div>
            ) : null}
            {showTradePartner ? (
              <div>
                <span>Trade Partner: </span>
                {tradePartnerUrl ? (
                  <Link href={tradePartnerUrl} className="link-blue">
                    {resolvedTradePartner}
                  </Link>
                ) : (
                  <span>{resolvedTradePartner}</span>
                )}
              </div>
            ) : null}
            {completedLabel && completedHref ? (
              <div>
                <span>Status: </span>
                <Link href={completedHref} className="link-blue">
                  {completedLabel}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="shrink-0 self-end sm:ml-auto sm:self-auto">
          {alterEgoTag}
        </div>
      </footer>
    </section>
  );

  const withSourceAnchor = (content: ReactNode) =>
    sectionOrdinal ? (
      <div
        id={getReleaseSectionAnchorId(sectionOrdinal)}
        className="scroll-mt-24"
      >
        {content}
      </div>
    ) : (
      content
    );

  const hasContainer = showReleaseDetails || hasPlainVisualContainer;
  const content = hasContainer ? (
    <div
      className={`rounded-lg border-[4px] border-solid border-[var(--blue)] px-4 py-4 ${effectiveDivider && showReleaseDetails ? "mb-10" : ""}`}
      style={{ borderColor: resolvedSectionColor }}
    >
      {baseContent}
    </div>
  ) : (
    baseContent
  );

  return withSourceAnchor(
    <>
      {content}
      {effectiveDivider && !hasContainer ? (
        <hr
          className="my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]"
          style={{ backgroundColor: resolvedSectionColor }}
        />
      ) : null}
    </>,
  );
}
