import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
import LcsListClient from "@/components/lcs/LcsListClient";
import { fmtDate } from "@/lib/datetime";
import type { LcsRouteConfig } from "@/lib/lcs-route-config";
import type { LcsSummary } from "@/lib/lcs-types";

type LcsLandingPageProps = {
  config: LcsRouteConfig;
  rows: LcsSummary[];
};

function getCollectionLatestDate(rows: LcsSummary[]): string | undefined {
  return rows
    .map((row) => row.latestVisitDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export default function LcsLandingPage({ config, rows }: LcsLandingPageProps) {
  const totalVisits = rows.reduce((total, row) => total + row.visitCount, 0);
  const latestVisitDate = getCollectionLatestDate(rows);
  const stats = [
    {
      label: "Shops",
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
      sectionId="lcs-directory"
      sectionEyebrow={config.collectionSectionEyebrow}
      sectionTitle={config.collectionDirectoryHeading}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--lcs-accent)",
        accentDeep: "var(--lcs-accent-deep)",
        foreground: "var(--lcs-pill-fg)",
        ink: "var(--lcs-ink)",
        sectionAccent: "var(--lcs-link)",
      }}
    >
      <LcsListClient
        rows={rows}
        detailBasePath={config.collectionPath}
        shopLabel={config.shopLabel}
        locationLabel={config.locationLabel}
        siteLabel={config.siteLabel}
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
