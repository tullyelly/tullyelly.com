import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import {
  PILL_BLUE,
  PILL_BLACK,
  PILL_CREAM_CITY,
  pillInteractionClasses,
} from "@/components/ui/pillStyles";
import { getScroll } from "@/lib/scrolls";
import {
  getTcdbTradeSummaryFromDb,
} from "@/lib/tcdb-trade-db";
import {
  getVolleyballTournamentDayByKeyAndDate,
  normalizeVolleyballTournamentDate,
  normalizeVolleyballTournamentKey,
} from "@/lib/volleyball-tournament-db";

/*
Spike note (ReleaseSection styling)
- Color source: border, tab, divider, bullets, and pills all resolve from the
  rainbow assignment value passed to `rainbowColour`.
- Tab integration: the tab sits inside the container with 4px borders; right border is removed and radii flattened on the right edge so it visually fuses with the parent border while still being a link.
- Rejected: release-type palette branching and ad hoc per-section color maps.
*/

export type ReviewType = "lcs" | "table-schema" | "save-point";

export type ReviewProps = {
  type: ReviewType;
  id: string | number;
  name: string;
  url?: string;
  rating?: string | number;
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
};

type ReleaseSectionWithReleaseId = ReleaseSectionBaseProps & {
  releaseId: string;
  tcdbTradeId?: never;
  review?: never;
};

type ReleaseSectionWithTcdbTrade = ReleaseSectionBaseProps & {
  tcdbTradeId: string;
  releaseId?: never;
  review?: never;
};

type ReleaseSectionWithReview = ReleaseSectionBaseProps & {
  review: ReviewProps;
  releaseId?: never;
  tcdbTradeId?: never;
};

type ReleaseSectionWithoutReleaseOrReview = ReleaseSectionBaseProps & {
  review?: undefined;
  releaseId?: undefined;
  tcdbTradeId?: undefined;
};

type ReleaseSectionProps =
  | ReleaseSectionWithReleaseId
  | ReleaseSectionWithTcdbTrade
  | ReleaseSectionWithReview
  | ReleaseSectionWithoutReleaseOrReview;

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
  if (type === "lcs") {
    return "Card Shop";
  }

  if (type === "table-schema") {
    return "Table Schema";
  }

  if (type === "save-point") {
    return "Save Point";
  }

  return type;
}

function getTournamentFinishLabel(finish: number | null): string | null {
  if (finish === 1) return "1st Place";
  if (finish === 2) return "2nd Place";
  if (finish === 3) return "3rd Place";
  return null;
}

// ReleaseSection acts as a no-op wrapper for MDX content and optionally renders a
// divider after the block (Great Lakes blue hr from global MDX styles).
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
 * - review: optional unified review metadata for local card shop, table schema, or future review types; must not be combined with releaseId or tcdbTradeId.
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
  const { review } = props;
  const {
    alterEgo,
    children,
    divider = true,
    releaseId,
    tcdbTradeId,
    tournamentId,
    tournamentDate,
    guestMage,
    rainbowColour,
  } = props;
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
      resolvedTournamentDate = normalizeVolleyballTournamentDate(tournamentDate);
    } catch {
      throw new Error(
        "ReleaseSection: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
      );
    }

    const tournamentDay = await getVolleyballTournamentDayByKeyAndDate(
      resolvedTournamentKey,
      resolvedTournamentDate,
    );

    if (!tournamentDay) {
      throw new Error(
        `ReleaseSection: no volleyball tournament found for tournamentId "${resolvedTournamentKey}" on "${resolvedTournamentDate}".`,
      );
    }

    resolvedTournamentKey = tournamentDay.tournamentKey;
    resolvedTournamentDate = tournamentDay.tournamentDate;
    resolvedTournamentName = tournamentDay.tournamentName;
    resolvedTournamentRecord = `${tournamentDay.wins}-${tournamentDay.losses}`;
    resolvedTournamentFinish = tournamentDay.finish;
  }

  const tcdbTradeSummary = tcdbTradeId
    ? await getTcdbTradeSummaryFromDb(tcdbTradeId)
    : null;
  const resolvedTradePartner = tcdbTradeSummary?.partner;
  const resolvedTradeReceived = tcdbTradeSummary?.received;
  const resolvedTradeSent = tcdbTradeSummary?.sent;
  const resolvedTradeTotal = tcdbTradeSummary?.total;

  if (tcdbTradeId) {
    releaseType = "tcdb";
    tradeUrl = `/cardattack/tcdb-trades/${tcdbTradeId}`;
    tradePartnerUrl = resolvedTradePartner
      ? `https://www.tcdb.com/Profile.cfm/${encodeURIComponent(
          resolvedTradePartner,
        )}`
      : undefined;
    tabLabel = `TCDb Trade: ${tcdbTradeId}${
      tradePartnerUrl ? `; Partner ${resolvedTradePartner}` : ""
    }`;
  } else if (releaseId) {
    const release = await getScroll(releaseId);
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
      completedLabel = `${tcdbTradeId}: completed`;
      completedHref = `/cardattack/tcdb-trades/${tcdbTradeId}`;
    }
  }

  const showTournament = Boolean(
    resolvedTournamentName && resolvedTournamentRecord,
  );
  const showReleaseDetails = Boolean(releaseId || tcdbTradeId);
  const showTournamentVisuals = showTournament && !showReleaseDetails;
  const tournamentFinishLabel = getTournamentFinishLabel(
    resolvedTournamentFinish ?? null,
  );
  const showReviewVisuals = Boolean(review);
  const shouldRenderReview = showReviewVisuals && !showReleaseDetails;
  const showReviewUrl = review?.url !== undefined && review.url.trim() !== "";
  const showReviewRating =
    review?.rating !== undefined && `${review.rating}`.trim() !== "";
  const reviewLabel = review ? getReviewLabel(review.type) : undefined;
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
    ? tabLabel
    : (releaseName ?? undefined);
  const guestMageStamp = guestMage?.trim();
  const showTradePartner = Boolean(tcdbTradeId && resolvedTradePartner);
  const showCompletionLink = Boolean(completedLabel && completedHref);
  const showTradeCardCounts = Boolean(
    tcdbTradeId && resolvedTradeTotal !== undefined,
  );
  const tradeCardSummary = [
    resolvedTradeReceived !== undefined
      ? `${resolvedTradeReceived} received`
      : null,
    resolvedTradeSent !== undefined ? `${resolvedTradeSent} sent` : null,
    resolvedTradeTotal !== undefined ? `${resolvedTradeTotal} total` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join("; ");
  const footerClassName =
    showTradePartner && showCompletionLink
      ? "flex justify-between items-center gap-2"
      : showTradePartner
        ? "flex justify-between items-center"
        : "flex justify-end";
  const showTournamentFinishFooter =
    showTournamentVisuals && Boolean(tournamentFinishLabel);
  const tournamentFinishHasTrophy = resolvedTournamentFinish === 1;
  const tournamentFinishClassName = tournamentFinishHasTrophy
    ? "inline-flex items-center justify-center gap-3 rounded-full border border-[var(--cream)] bg-black pl-2.5 pr-4 py-2 text-sm font-semibold text-[var(--cream)] shadow-sm"
    : "inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-muted-foreground";
  const alterEgoTag = (
    <Link
      href={`/shaolin/tags/${encodeURIComponent(alterEgo.toLowerCase())}`}
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
    </Link>
  );

  const baseContent = (
    <div
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
      data-tournament-finish={
        resolvedTournamentFinish !== undefined &&
        resolvedTournamentFinish !== null
          ? String(resolvedTournamentFinish)
          : undefined
      }
      data-review-type={review?.type ?? undefined}
      data-review-id={review !== undefined ? String(review.id) : undefined}
      data-review-name={review?.name ?? undefined}
      data-review-rating={showReviewRating ? String(review?.rating) : undefined}
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
      {guestMageStamp && (
        <div className="flex items-start">
          <Badge className={getBadgeClass("chore")}>
            {`Guest Mage: ${guestMageStamp}`}
          </Badge>
        </div>
      )}
      {children}
      {showTournamentVisuals ? (
        <div className="text-sm">{`${resolvedTournamentName}: ${resolvedTournamentRecord}`}</div>
      ) : null}
      {shouldRenderReview && review?.type === "lcs" && reviewLabel ? (
        <div className="text-sm">
          <span>{`${reviewLabel}: `}</span>
          {showReviewUrl && review.url ? (
            <Link
              href={review.url}
              className="link-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              {review.name}
            </Link>
          ) : (
            <span>{review.name}</span>
          )}
          {showReviewRating ? <span>{` (${review.rating})`}</span> : null}
        </div>
      ) : null}
      {shouldRenderReview && review?.type === "table-schema" && reviewLabel ? (
        <div className="text-sm">
          <span>{`${reviewLabel}: `}</span>
          {showReviewUrl && review.url ? (
            <Link
              href={review.url}
              className="link-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              {review.name}
            </Link>
          ) : (
            <span>{review.name}</span>
          )}
          {showReviewRating ? <span>{` (${review.rating})`}</span> : null}
        </div>
      ) : null}
      {shouldRenderReview && review?.type === "save-point" && reviewLabel ? (
        <div className="text-sm">
          <span>{`${reviewLabel}: `}</span>
          {showReviewUrl && review.url ? (
            <Link
              href={review.url}
              className="link-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              {review.name}
            </Link>
          ) : (
            <span>{review.name}</span>
          )}
          {showReviewRating ? <span>{` (${review.rating})`}</span> : null}
        </div>
      ) : null}
      {showTradeCardCounts ? (
        <div className="text-sm">{`Card Traffic: ${tradeCardSummary}`}</div>
      ) : null}
      {showTournamentFinishFooter ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
            <span className="leading-none">{tournamentFinishLabel}</span>
          </div>
          {alterEgoTag}
        </div>
      ) : (
        <div className={footerClassName}>
          {showTradePartner && tradePartnerUrl ? (
            <div className="text-sm">
              <span>Trade Partner: </span>
              <Link href={tradePartnerUrl} className="link-blue">
                {resolvedTradePartner}
              </Link>
            </div>
          ) : null}
          {completedLabel && completedHref ? (
            <Link href={completedHref} className="link-blue text-sm">
              {completedLabel}
            </Link>
          ) : null}
          {alterEgoTag}
        </div>
      )}
    </div>
  );

  if (!showReleaseDetails) {
    const plainContent = showTournamentVisuals ? (
      <div
        className="rounded-lg border-[4px] border-solid border-[var(--blue)] px-4 py-4"
        style={{ borderColor: resolvedSectionColor }}
      >
        {baseContent}
      </div>
    ) : review?.type === "lcs" && showReviewVisuals ? (
      <div
        className="rounded-lg border-[4px] border-solid border-[var(--blue)] px-4 py-4"
        style={{ borderColor: resolvedSectionColor }}
      >
        {baseContent}
      </div>
    ) : review?.type === "table-schema" && showReviewVisuals ? (
      <div
        className="rounded-lg border-[4px] border-solid border-[var(--table-schema-spice)] px-4 py-4"
        style={{ borderColor: resolvedSectionColor }}
      >
        {baseContent}
      </div>
    ) : review?.type === "save-point" && showReviewVisuals ? (
      <div
        className="rounded-lg border-[4px] border-solid border-[var(--blue)] px-4 py-4"
        style={{ borderColor: resolvedSectionColor }}
      >
        {baseContent}
      </div>
    ) : (
      baseContent
    );

    return (
      <>
        {plainContent}
        {divider ? (
          <hr
            className="my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]"
            style={
              resolvedSectionColor
                ? ({
                    backgroundColor: resolvedSectionColor,
                  } satisfies CSSProperties)
                : undefined
            }
          />
        ) : null}
      </>
    );
  }

  const borderStyle = {
    borderColor: resolvedSectionColor,
    borderWidth: "4px",
  };
  const tabStyle: CSSProperties = {
    outlineColor: resolvedSectionColor,
    textDecoration: "none",
    ["--tab-bg" as string]: resolvedSectionColor,
    ["--tab-fg" as string]: tabForegroundColor,
    ["--tab-hover-bg" as string]: hoverBackgroundColor,
    ["--tab-hover-fg" as string]: hoverForegroundColor,
    borderColor: resolvedSectionColor,
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  };

  const releaseContainerClassName = [
    "relative rounded-lg border-[4px] px-4 pt-10 pb-4 md:pt-8",
    divider ? "mb-10" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const releaseContainer = (
    <div className={releaseContainerClassName} style={borderStyle}>
      {tabLabel && tabHref ? (
        <Link
          href={tabHref}
          prefetch={false}
          className={[
            "absolute -top-[4px] left-[-4px] inline-flex items-center gap-1 rounded-tl-lg rounded-tr-md border-[4px] border-b-0 px-3 py-1 text-sm font-semibold leading-none",
            pillInteractionClasses,
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
  );

  return <>{releaseContainer}</>;
}
