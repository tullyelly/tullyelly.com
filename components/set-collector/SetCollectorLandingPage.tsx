import CollectionDirectoryPage from "@/components/layout/CollectionDirectoryPage";
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
    <CollectionDirectoryPage
      heroEyebrow="cardattack set tracker"
      title="Set Collector"
      description={
        <>
          DB-backed progress dossiers for the card sets I&apos;m trying to
          finish; snapshot history, ratings, and trade breadcrumbs all stay in
          one place.
        </>
      }
      stats={stats}
      sectionId="set-collector-directory"
      sectionEyebrow="collection directory"
      sectionTitle="Tracked Sets"
      pageThemeStyle={setCollectorPageThemeVars}
      theme={{
        accent: "var(--collector-accent)",
        accentDeep: "var(--collector-accent-deep)",
        foreground: "var(--collector-pill-fg)",
        ink: "var(--collector-ink)",
        sectionAccent: "var(--collector-link)",
      }}
    >
      <SetCollectorListClient
        rows={rows}
        detailBasePath="/cardattack/set-collector"
        emptyMessage="No tracked sets have been added to Set Collector yet."
        tableAriaLabel="Set Collector tracked sets table"
        themeStyle={setCollectorTableThemeStyle}
      />
    </CollectionDirectoryPage>
  );
}
