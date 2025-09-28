import type { FeatureKey } from "@/lib/authz/types";
import { mustCurrentUser } from "@/lib/authz";

const TCDB_SNAPSHOT_CREATE: FeatureKey = "tcdb.snapshot.create";

export async function requirePermission(feature: FeatureKey): Promise<void> {
  await mustCurrentUser(feature, { strict: true });
}

export async function requireTcdbSnapshotCreate(): Promise<void> {
  await requirePermission(TCDB_SNAPSHOT_CREATE);
}
