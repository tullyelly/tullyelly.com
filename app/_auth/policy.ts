import { sql } from "@/lib/db";

export interface EffectiveFeatureSnapshot {
  features: string[];
  revision: number;
}

function toFeatureList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .replace(/[{}]/g, "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

export async function getAuthzRevision(
  userId: string | null | undefined,
): Promise<number> {
  if (process.env.SKIP_DB === "true") return 0;
  if (!userId) return 0;
  const rows = await sql<{ revision: number | null }>`
    SELECT dojo.authz_get_revision(${userId}::uuid) AS revision
  `;
  return rows[0]?.revision ?? 0;
}

export async function getEffectiveFeatures(
  userId: string | null | undefined,
): Promise<EffectiveFeatureSnapshot> {
  if (process.env.SKIP_DB === "true") {
    return { features: [], revision: 0 };
  }
  if (!userId) {
    return { features: [], revision: 0 };
  }

  const rows = await sql<{
    features: string[] | string | null;
    revision: number | null;
  }>`
    SELECT
      COALESCE(array_agg(feature_key ORDER BY feature_key), '{}') AS features,
      dojo.authz_get_revision(${userId}::uuid) AS revision
    FROM dojo.v_authz_effective_features
    WHERE user_id = ${userId}::uuid
  `;

  const row = rows[0];
  const features = Array.from(new Set(toFeatureList(row?.features))).sort();
  const revision = row?.revision ?? 0;

  return { features, revision };
}
