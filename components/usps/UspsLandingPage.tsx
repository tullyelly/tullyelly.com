import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
import UspsListClient from "@/components/usps/UspsListClient";
import type { UspsSummary } from "@/lib/usps-db";
import type { UspsRouteConfig } from "@/lib/usps-route-config";
import { fmtDate } from "@/lib/datetime";

type UspsLandingPageProps = {
  config: UspsRouteConfig;
  rows: UspsSummary[];
};

function getCollectionLatestDate(rows: UspsSummary[]): string | undefined {
  return rows
    .map((row) => row.latestVisitDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export default function UspsLandingPage({
  config,
  rows,
}: UspsLandingPageProps) {
  const totalVisits = rows.reduce((total, row) => total + row.visitCount, 0);
  const latestVisitDate = getCollectionLatestDate(rows);
  const stats = [
    {
      label: "Locations",
      value: String(rows.length),
    },
    {
      label: config.countLabel,
      value: String(totalVisits),
    },
    {
      label: config.latestCountLabel,
      value: latestVisitDate
        ? fmtDate(latestVisitDate, "America/Chicago", "long")
        : "Not available",
    },
  ];

  return (
    <CollectionDirectoryPage
      heroEyebrow={`${config.brandTitle} ${config.collectionSectionEyebrow}`}
      title={config.collectionHeroTitle}
      description={config.collectionHeroDescription}
      stats={stats}
      sectionId="usps-directory"
      sectionEyebrow={config.collectionSectionEyebrow}
      sectionTitle={config.collectionDirectoryHeading}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--usps-accent)",
        accentDeep: "var(--usps-accent-deep)",
        foreground: "var(--usps-pill-fg)",
        ink: "var(--usps-ink)",
        sectionAccent: "var(--usps-link)",
      }}
    >
      <UspsListClient
        rows={rows}
        detailBasePath={config.collectionPath}
        locationLabel={config.locationLabel}
        stateLabel={config.stateLabel}
        ratingLabel={config.ratingLabel}
        countLabel={config.countLabel}
        firstCountLabel={config.firstCountLabel}
        latestCountLabel={config.latestCountLabel}
        emptyMessage={config.emptyCollectionMessage}
        tableAriaLabel={config.collectionTableAriaLabel}
        themeStyle={config.tableThemeStyle}
      />
    </CollectionDirectoryPage>
  );
}
