import "server-only";

import {
  getSetCollectorSummaryFromDb,
  listSetCollectorSnapshotsFromDb,
  listSetCollectorSummariesFromDb,
  type SetCollectorSnapshot as SetCollectorDbSnapshot,
  type SetCollectorSummary as SetCollectorDbSummary,
} from "@/lib/set-collector-db";
import { normalizeSetCollectorId } from "@/lib/set-collector-types";

export type SetCollectorSummaryRow = SetCollectorDbSummary;
export type SetCollectorSnapshotRow = SetCollectorDbSnapshot;
export type SetCollectorPageData = SetCollectorSummaryRow & {
  latestSnapshot?: SetCollectorSnapshotRow;
  snapshots: SetCollectorSnapshotRow[];
};

export function getSetCollectorDetailHref(id: string | number): string {
  const normalizedId = normalizeSetCollectorId(id);
  return `/cardattack/set-collector/${encodeURIComponent(String(normalizedId))}`;
}

export async function listSetCollectorSummaryRows(): Promise<
  SetCollectorSummaryRow[]
> {
  return listSetCollectorSummariesFromDb();
}

export async function getSetCollectorSummaryRow(
  id: string | number,
): Promise<SetCollectorSummaryRow | null> {
  const normalizedId = normalizeSetCollectorId(id);
  return getSetCollectorSummaryFromDb(normalizedId);
}

export async function listSetCollectorSnapshotRows(
  id: string | number,
): Promise<SetCollectorSnapshotRow[]> {
  const normalizedId = normalizeSetCollectorId(id);
  return listSetCollectorSnapshotsFromDb(normalizedId);
}

export async function getSetCollectorPageData(
  id: string | number,
): Promise<SetCollectorPageData | null> {
  const normalizedId = normalizeSetCollectorId(id);
  const [summary, snapshots] = await Promise.all([
    getSetCollectorSummaryFromDb(normalizedId),
    listSetCollectorSnapshotsFromDb(normalizedId),
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
