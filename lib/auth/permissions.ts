import type { FeatureKey } from "@/lib/authz/types";
import { mustCurrentUser } from "@/lib/authz";

const TCDB_SNAPSHOT_CREATE: FeatureKey = "tcdb.snapshot.create";
const TCDB_HOMIE_UPDATE: FeatureKey = "tcdb.homie.update";
const SCROLLS_RELEASE_CREATE: FeatureKey = "scrolls.release.create";

export async function requirePermission(feature: FeatureKey): Promise<void> {
  await mustCurrentUser(feature, { strict: true });
}

export async function requireTcdbSnapshotCreate(): Promise<void> {
  await requirePermission(TCDB_SNAPSHOT_CREATE);
}

export async function requireTcdbHomieUpdate(): Promise<void> {
  await requirePermission(TCDB_HOMIE_UPDATE);
}

export async function requireScrollsReleaseCreate(): Promise<void> {
  await requirePermission(SCROLLS_RELEASE_CREATE);
}
