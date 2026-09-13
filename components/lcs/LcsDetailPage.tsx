import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import LcsChronicleFeed from "@/components/lcs/LcsChronicleFeed";
import type { LcsPageData } from "@/lib/lcs-content";
import { fmtDate } from "@/lib/datetime";
import type { LcsRouteConfig } from "@/lib/lcs-route-config";

type LcsDetailPageProps = {
  config: LcsRouteConfig;
  lcs: LcsPageData;
};

function formatVisitDate(value?: string): string {
  return value ? fmtDate(value, "America/Chicago", "long") : "Not available";
}

function formatRating(value: number): string {
  return `${value.toFixed(1)}/10`;
}

function formatLocation(
  lcs: Pick<LcsPageData, "city" | "state">,
): string | null {
  const parts = [lcs.city, lcs.state].filter((value): value is string =>
    Boolean(value),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function LcsDetailPage({
  config,
  lcs,
}: LcsDetailPageProps) {
  const location = formatLocation(lcs);
  const summaryStats = [
    {
      label: config.shopLabel,
      value: lcs.name,
    },
    {
      label: config.slugLabel,
      value: lcs.slug,
    },
    ...(location
      ? [
          {
            label: config.locationLabel,
            value: location,
          },
        ]
      : []),
    ...(lcs.url
      ? [
          {
            label: config.siteLabel,
            value: (
              <a
                href={lcs.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center rounded-full border border-white bg-white px-3 py-1.5 text-[color:var(--lcs-link)] shadow-sm transition hover:bg-[color:var(--lcs-accent-soft)] xl:whitespace-nowrap"
              >
                {lcs.url}
              </a>
            ),
          },
        ]
      : []),
    {
      label: config.ratingLabel,
      value: (
        <span className="inline-flex min-h-9 items-center rounded-full bg-[color:var(--lcs-accent)] px-3 py-1 text-[color:var(--lcs-pill-fg)] shadow-sm">
          {formatRating(lcs.rating)}
        </span>
      ),
    },
    {
      label: config.countLabel,
      value: String(lcs.visitCount),
    },
    {
      label: config.firstCountLabel,
      value: formatVisitDate(lcs.firstVisitDate),
    },
    {
      label: config.latestCountLabel,
      value: formatVisitDate(lcs.latestVisitDate),
    },
  ];

  return (
    <CollectionDetailPage
      backHref={config.collectionPath}
      backLabel={config.detailBackLabel}
      eyebrow={config.detailHeroEyebrow}
      title={lcs.name}
      subtitle={location}
      stats={summaryStats}
      statColumns={3}
      sectionId="lcs-chronicle-feed"
      sectionTitle={config.detailFeedHeading}
      sectionDescription={config.detailFeedDescription}
      pageThemeStyle={config.pageThemeVars}
      theme={{
        accent: "var(--lcs-accent)",
        accentDeep: "var(--lcs-accent-deep)",
        foreground: "var(--lcs-pill-fg)",
        ink: "var(--lcs-ink)",
        link: "var(--lcs-link)",
        linkHover: "var(--lcs-link-hover)",
        accentSoft: "var(--lcs-accent-soft)",
      }}
    >
      <LcsChronicleFeed
        days={lcs.days}
        entryLabel={config.entryLabel}
        emptyMessage={config.emptyFeedMessage}
        missingContentMessage={config.missingContentMessage}
      />
    </CollectionDetailPage>
  );
}
