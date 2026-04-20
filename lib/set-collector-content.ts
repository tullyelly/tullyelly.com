import "server-only";

import {
  getSetCollectorSummaryForDateFromDb,
  getSetCollectorSummaryFromDb,
  listSetCollectorSnapshotsFromDb,
  listSetCollectorSummariesFromDb,
  type SetCollectorSnapshot as SetCollectorDbSnapshot,
  type SetCollectorSummary as SetCollectorDbSummary,
} from "@/lib/set-collector-db";
import { normalizeSetCollectorSlug } from "@/lib/set-collector-types";

export type SetCollectorSummaryRow = SetCollectorDbSummary;
export type SetCollectorSnapshotRow = SetCollectorDbSnapshot;
export type SetCollectorPageData = SetCollectorSummaryRow & {
  latestSnapshot?: SetCollectorSnapshotRow;
  snapshots: SetCollectorSnapshotRow[];
};

export function getSetCollectorDetailHref(slug: string | number): string {
  const normalizedSlug = normalizeSetCollectorSlug(slug);
  return `/cardattack/set-collector/${encodeURIComponent(normalizedSlug)}`;
}

export async function listSetCollectorSummaryRows(): Promise<
  SetCollectorSummaryRow[]
> {
  return listSetCollectorSummariesFromDb();
}

export async function getSetCollectorSummaryRow(
  slug: string | number,
  snapshotDate?: string,
): Promise<SetCollectorSummaryRow | null> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);
  return snapshotDate
    ? getSetCollectorSummaryForDateFromDb(normalizedSlug, snapshotDate)
    : getSetCollectorSummaryFromDb(normalizedSlug);
}

export async function listSetCollectorSnapshotRows(
  slug: string | number,
): Promise<SetCollectorSnapshotRow[]> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);
  return listSetCollectorSnapshotsFromDb(normalizedSlug);
}

export async function getSetCollectorPageData(
  slug: string | number,
): Promise<SetCollectorPageData | null> {
  const normalizedSlug = normalizeSetCollectorSlug(slug);
  const [summary, snapshots] = await Promise.all([
    getSetCollectorSummaryFromDb(normalizedSlug),
    listSetCollectorSnapshotsFromDb(normalizedSlug),
  ]);

  if (!summary) {
    return null;
  }

  const latestSnapshot = snapshots.at(-1);

  return {
    ...summary,
    snapshots,
    ...(latestSnapshot ? { latestSnapshot } : {}),
  };
}
