import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import BricksChronicleFeed from "@/components/bricks/BricksChronicleFeed";
import type { BricksPageData } from "@/lib/bricks-content";
import type { BricksRouteConfig } from "@/lib/bricks-route-config";
import { formatBricksReviewScore } from "@/lib/bricks-types";
import { fmtDate } from "@/lib/datetime";

type BricksDetailPageProps = {
  config: BricksRouteConfig;
  bricks: BricksPageData;
};

function formatSessionDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

export default async function BricksDetailPage({
  config,
  bricks,
}: BricksDetailPageProps) {
  const summaryStats = [
    {
      label: config.subjectLabel,
      value: bricks.setName,
    },
    {
      label: config.subjectIdLabel,
      value: bricks.publicId,
    },
    {
      label: config.scoreLabel,
      value: (
        <span className="inline-flex min-h-9 items-center rounded-full bg-[color:var(--bricks-accent)] px-3 py-1 text-[color:var(--bricks-pill-fg)] shadow-sm">
          {formatBricksReviewScore(bricks.reviewScore)}
        </span>
      ),
    },
    {
      label: config.countLabel,
      value: String(bricks.sessionCount),
    },
    {
      label: config.tagLabel,
      value: bricks.tag ?? "Not available",
    },
    {
      label: config.pieceCountLabel,
      value:
        bricks.pieceCount !== undefined
          ? String(bricks.pieceCount)
          : "Not available",
    },
    {
      label: config.firstCountLabel,
      value: formatSessionDate(bricks.firstBuildDate),
    },
    {
      label: config.latestCountLabel,
      value: formatSessionDate(bricks.latestBuildDate),
    },
  ];

  return (
    <CollectionDetailPage
      backHref={config.collectionPath}
      backLabel={config.detailBackLabel}
      eyebrow={config.detailHeroEyebrow}
      title={bricks.setName}
      stats={summaryStats}
      statColumns={4}
      sectionId={`${config.subset}-chronicle-feed`}
      sectionTitle={config.detailFeedHeading}
      sectionDescription={config.detailFeedDescription}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--bricks-accent)",
        accentDeep: "var(--bricks-accent-deep)",
        foreground: "var(--bricks-pill-fg)",
        ink: "var(--bricks-ink)",
        link: "var(--bricks-link)",
        linkHover: "var(--bricks-link-hover)",
        accentSoft: "var(--bricks-accent-soft)",
      }}
    >
      <BricksChronicleFeed
        days={bricks.days}
        entryLabel={config.entryLabel}
        emptyMessage={config.emptyFeedMessage}
        missingContentMessage={config.missingContentMessage}
      />
    </CollectionDetailPage>
  );
}
