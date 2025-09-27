/**
 * WU-377: Capability resolution (DB → EffectivePolicy)
 * Reads from:
 *  - auth.users (id TEXT)
 *  - dojo.authz_user_role (user_id TEXT, role_id BIGINT)
 *  - dojo.authz_role_feature (role_id BIGINT, feature_id BIGINT, effect 'allow'|'deny')
 *  - dojo.authz_feature (id BIGINT, key TEXT, enabled BOOLEAN)
 */
import { unstable_cache } from "next/cache";
import { getPool } from "@/db/pool";
import type { EffectivePolicy } from "./types";

type DbRow = { key: string; effect: "allow" | "deny"; enabled: boolean };
type CachedPolicy = {
  allow: string[];
  deny: string[];
  enabled: string[];
  revision: number;
};

async function fetchPolicySnapshot(userId: string): Promise<CachedPolicy> {
  const db = getPool();
  const { rows } = await db.query<DbRow>(
    `
    WITH memberships AS (
      SELECT ur.role_id, NULL::BIGINT AS app_id
      FROM dojo.authz_user_app_role ur
      WHERE ur.user_id = $1::uuid AND ur.app_id IS NULL
      UNION ALL
      SELECT ur.role_id, ur.app_id
      FROM dojo.authz_user_app_role ur
      WHERE ur.user_id = $1::uuid AND ur.app_id IS NOT NULL
    )
    SELECT f.key, rf.effect::text AS effect, f.enabled
    FROM memberships m
    JOIN dojo.authz_role_feature rf ON rf.role_id = m.role_id
    JOIN dojo.authz_feature f       ON f.id = rf.feature_id
    WHERE (m.app_id IS NULL OR m.app_id = f.app_id)
  `,
    [userId],
  );

  const revRes = await db.query<{ revision: number }>(
    `SELECT dojo.authz_get_revision($1::uuid) AS revision`,
    [userId],
  );

  const allow = new Set<string>();
  const deny = new Set<string>();
  const enabled = new Set<string>();
  for (const r of rows) {
    if (r.enabled) enabled.add(r.key);
    if (r.effect === "allow") allow.add(r.key);
    else deny.add(r.key);
  }

  return {
    allow: Array.from(allow),
    deny: Array.from(deny),
    enabled: Array.from(enabled),
    revision: revRes.rows?.[0]?.revision ?? 0,
  };
}

/**
 * Cache effective policy per user.
 * Invalidate via revalidateTag('auth:user:{id}') on membership/feature changes.
 */
export async function getEffectivePolicy(
  userId: string,
): Promise<EffectivePolicy> {
  const cached = await unstable_cache(
    () => fetchPolicySnapshot(userId),
    ["authz-policy", userId],
    { tags: [`auth:user:${userId}`] },
  )();

  return {
    allow: new Set(cached.allow),
    deny: new Set(cached.deny),
    enabled: new Set(cached.enabled),
    revision: cached.revision,
  };
}

export const __debugFetchPolicyRows = fetchPolicySnapshot;
