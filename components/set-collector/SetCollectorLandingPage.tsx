import FullBleedPage from "@/components/layout/FullBleedPage";
import SetCollectorListClient from "@/components/set-collector/SetCollectorListClient";
import type { SetCollectorSummaryRow } from "@/lib/set-collector-content";
import { fmtDate } from "@/lib/datetime";
import {
  setCollectorPageThemeVars,
  setCollectorTableThemeStyle,
} from "@/lib/set-collector-theme";

type SetCollectorLandingPageProps = {
  rows: SetCollectorSummaryRow[];
};

const summaryValueClassName = "text-sm font-semibold leading-snug";
const summaryLabelClassName =
  "text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.18em] opacity-75 md:text-[0.72rem]";

function getLatestSnapshotDate(
  rows: SetCollectorSummaryRow[],
): string | undefined {
  return rows
    .map((row) => row.latestSnapshotDate)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export default function SetCollectorLandingPage({
  rows,
}: SetCollectorLandingPageProps) {
  const totalSnapshots = rows.reduce(
    (total, row) => total + row.snapshotCount,
    0,
  );
  const latestSnapshotDate = getLatestSnapshotDate(rows);
  const stats = [
    {
      label: "Tracked Sets",
      value: String(rows.length),
    },
    {
      label: "Snapshots",
      value: String(totalSnapshots),
    },
    {
      label: "Latest Snapshot",
      value: latestSnapshotDate
        ? fmtDate(latestSnapshotDate, "America/Chicago", "long")
        : "Not available",
    },
  ];

  return (
    <FullBleedPage articleClassName="md:max-w-[76rem] xl:max-w-[82rem]">
      <div
        className="space-y-8 px-1 py-6 md:px-2 md:py-8"
        style={setCollectorPageThemeVars}
      >
        <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--collector-accent)_0%,var(--collector-accent-deep)_100%)] text-[color:var(--collector-pill-fg)] shadow-sm">
          <div className="space-y-6 px-4 py-5 md:px-6 md:py-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                cardattack set tracker
              </p>
              <div className="space-y-2">
                <h1 className="text-[1.9rem] font-bold leading-none md:text-[2.35rem]">
                  Set Collector
                </h1>
                <p className="max-w-3xl text-[15px] leading-7 text-white/88 md:text-[17px]">
                  DB-backed progress dossiers for the card sets I&apos;m trying
                  to finish; snapshot history, ratings, and trade breadcrumbs
                  all stay in one place.
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

        <section aria-labelledby="set-collector-directory" className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--collector-link)]/70">
              collection directory
            </p>
            <h2
              id="set-collector-directory"
              className="text-2xl font-semibold leading-tight text-[color:var(--collector-ink)] md:text-3xl"
            >
              Tracked Sets
            </h2>
          </div>

          <SetCollectorListClient
            rows={rows}
            detailBasePath="/cardattack/set-collector"
            emptyMessage="No tracked sets have been added to Set Collector yet."
            tableAriaLabel="Set Collector tracked sets table"
            themeStyle={setCollectorTableThemeStyle}
          />
        </section>
      </div>
    </FullBleedPage>
  );
}
