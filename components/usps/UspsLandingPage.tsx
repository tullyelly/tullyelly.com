import FullBleedPage from "@/components/layout/FullBleedPage";
import UspsListClient from "@/components/usps/UspsListClient";
import type { UspsSummary } from "@/lib/usps-db";
import type { UspsRouteConfig } from "@/lib/usps-route-config";
import { fmtDate } from "@/lib/datetime";

type UspsLandingPageProps = {
  config: UspsRouteConfig;
  rows: UspsSummary[];
};

const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem]";

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
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={config.pageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--usps-accent)_0%,var(--usps-accent-deep)_100%)] text-[color:var(--usps-pill-fg)] shadow-sm">
          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                {`${config.brandTitle} ${config.collectionSectionEyebrow}`}
              </p>
              <div className="space-y-2">
                <h1 className="text-[1.9rem] font-bold leading-none md:text-[2.35rem]">
                  {config.collectionHeroTitle}
                </h1>
                <p className="max-w-3xl text-[15px] leading-7 text-white/88 md:text-[17px]">
                  {config.collectionHeroDescription}
                </p>
              </div>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-black/10 px-3.5 py-3 md:px-4 md:py-3.5"
                >
                  <dt className={summaryLabelClassName}>{stat.label}</dt>
                  <dd className={`mt-2 ${summaryValueClassName}`}>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="usps-directory" className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--usps-link)]/70">
              {config.collectionSectionEyebrow}
            </p>
            <h2
              id="usps-directory"
              className="text-2xl font-semibold leading-tight text-[color:var(--usps-ink)] md:text-3xl"
            >
              {config.collectionDirectoryHeading}
            </h2>
          </div>

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
        </section>
      </div>
    </FullBleedPage>
  );
}
