import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import UspsChronicleFeed from "@/components/usps/UspsChronicleFeed";
import type { UspsPageData } from "@/lib/usps-content";
import { fmtDate } from "@/lib/datetime";
import type { UspsRouteConfig } from "@/lib/usps-route-config";

type UspsDetailPageProps = {
  config: UspsRouteConfig;
  usps: UspsPageData;
};

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

export default async function UspsDetailPage({
  config,
  usps,
}: UspsDetailPageProps) {
  const summaryStats = [
    {
      label: config.locationLabel,
      value: usps.cityName,
    },
    {
      label: config.stateLabel,
      value: usps.state,
    },
    {
      label: config.ratingLabel,
      value: (
        <span className="inline-flex min-h-9 items-center rounded-full bg-[color:var(--usps-accent)] px-3 py-1 text-[color:var(--usps-pill-fg)] shadow-sm">
          {formatRating(usps.rating)}
        </span>
      ),
    },
    {
      label: config.countLabel,
      value: String(usps.visitCount),
    },
    {
      label: config.firstCountLabel,
      value: formatVisitDate(usps.firstVisitDate),
    },
    {
      label: config.latestCountLabel,
      value: formatVisitDate(usps.latestVisitDate),
    },
  ];

  return (
    <CollectionDetailPage
      backHref={config.collectionPath}
      backLabel={config.detailBackLabel}
      eyebrow={config.detailHeroEyebrow}
      title={`${usps.cityName}, ${usps.state}`}
      stats={summaryStats}
      statColumns={3}
      sectionId="usps-chronicle-feed"
      sectionTitle={config.detailFeedHeading}
      sectionDescription={config.detailFeedDescription}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--usps-accent)",
        accentDeep: "var(--usps-accent-deep)",
        foreground: "var(--usps-pill-fg)",
        ink: "var(--usps-ink)",
        link: "var(--usps-link)",
        linkHover: "var(--usps-link-hover)",
        accentSoft: "var(--usps-accent-soft)",
      }}
    >
      <UspsChronicleFeed
        days={usps.days}
        entryLabel={config.entryLabel}
        emptyMessage={config.emptyFeedMessage}
        missingContentMessage={config.missingContentMessage}
      />
    </CollectionDetailPage>
  );
}
