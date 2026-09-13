import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
import BricksListClient from "@/components/bricks/BricksListClient";
import type { BricksSummary } from "@/lib/bricks-db";
import type { BricksRouteConfig } from "@/lib/bricks-route-config";
import { fmtDate } from "@/lib/datetime";

type BricksLandingPageProps = {
  config: BricksRouteConfig;
  rows: BricksSummary[];
};

function getLatestBuildDate(rows: BricksSummary[]): string | undefined {
  return rows
    .map((row) => row.latestBuildDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export default function BricksLandingPage({
  config,
  rows,
}: BricksLandingPageProps) {
  const totalSessions = rows.reduce(
    (total, row) => total + row.sessionCount,
    0,
  );
  const latestBuildDate = getLatestBuildDate(rows);
  const stats = [
    {
      label: "Sets",
      value: String(rows.length),
    },
    {
      label: config.countLabel,
      value: String(totalSessions),
    },
    {
      label: config.latestCountLabel,
      value: latestBuildDate
        ? fmtDate(latestBuildDate, "America/Chicago", "long")
        : "Not available",
    },
  ];

  return (
    <CollectionDirectoryPage
      heroEyebrow={`${config.brandTitle} ${config.collectionSectionEyebrow}`}
      title={config.collectionHeroTitle}
      description={config.collectionHeroDescription}
      stats={stats}
      sectionId={`${config.subset}-directory`}
      sectionEyebrow={config.collectionSectionEyebrow}
      sectionTitle={config.collectionDirectoryHeading}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--bricks-accent)",
        accentDeep: "var(--bricks-accent-deep)",
        foreground: "var(--bricks-pill-fg)",
        ink: "var(--bricks-ink)",
        sectionAccent: "var(--bricks-link)",
      }}
    >
      <BricksListClient
        rows={rows}
        detailBasePath={config.collectionPath}
        emptyMessage={config.emptyCollectionMessage}
        tableAriaLabel={config.collectionTableAriaLabel}
        themeStyle={config.tableThemeStyle}
      />
    </CollectionDirectoryPage>
  );
}
