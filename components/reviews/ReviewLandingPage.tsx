import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
import ReviewListClient from "@/components/reviews/ReviewListClient";
import type { ReviewSummary } from "@/lib/review-content";
import type { ReviewRouteConfig } from "@/lib/review-route-config";
import { fmtDate } from "@/lib/datetime";

type ReviewLandingPageProps = {
  config: ReviewRouteConfig;
  rows: ReviewSummary[];
};

function getCollectionLatestDate(rows: ReviewSummary[]): string | undefined {
  return rows
    .map((row) => row.latestPostDate)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export default function ReviewLandingPage({
  config,
  rows,
}: ReviewLandingPageProps) {
  const totalReferences = rows.reduce(
    (total, row) => total + row.visitCount,
    0,
  );
  const latestChronicleDate = getCollectionLatestDate(rows);
  const stats = [
    {
      label: "Subjects",
      value: String(rows.length),
    },
    {
      label: config.countLabel,
      value: String(totalReferences),
    },
    {
      label: config.latestCountLabel,
      value: latestChronicleDate
        ? fmtDate(latestChronicleDate, "America/Chicago", "long")
        : "Not available",
    },
  ];

  return (
    <CollectionDirectoryPage
      heroEyebrow={`${config.brandTitle} ${config.collectionSectionEyebrow}`}
      title={config.collectionHeroTitle}
      description={config.collectionHeroDescription}
      stats={stats}
      sectionId={`${config.type}-directory`}
      sectionEyebrow={config.collectionSectionEyebrow}
      sectionTitle={config.collectionDirectoryHeading}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--review-accent)",
        accentDeep: "var(--review-accent-deep)",
        foreground: "var(--review-pill-fg)",
        ink: "var(--review-ink)",
        sectionAccent: "var(--review-link)",
      }}
    >
      <ReviewListClient
        rows={rows.map((row) => ({
          id: row.externalId,
          name: row.name,
          url: row.url,
          averageRating: row.averageRating,
          visitCount: row.visitCount,
          latestPostDate: row.latestPostDate,
        }))}
        detailBasePath={config.collectionPath}
        subjectLabel={config.subjectLabel}
        subjectIdLabel={config.subjectIdLabel}
        countLabel={config.countLabel}
        lastCountLabel={config.latestCountLabel}
        externalLinkLabel={config.outboundLinkLabel}
        emptyMessage={config.emptyCollectionMessage}
        tableAriaLabel={config.collectionTableAriaLabel}
        tableFirstColumnLabel={config.collectionTableFirstColumnLabel}
        tableExternalLinkLabel={config.tableExternalLinkLabel}
        themeStyle={config.tableThemeStyle}
      />
    </CollectionDirectoryPage>
  );
}
