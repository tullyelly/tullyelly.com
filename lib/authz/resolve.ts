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

async function fetchPolicyRows(userId: string): Promise<DbRow[]> {
  const db = getPool();
  const res = await db.query<DbRow>(
    `
    SELECT f.key, rf.effect::text AS effect, f.enabled
    FROM dojo.authz_user_role ur
    JOIN dojo.authz_role_feature rf ON rf.role_id = ur.role_id
    JOIN dojo.authz_feature f       ON f.id = rf.feature_id
    WHERE ur.user_id = $1
  `,
    [userId],
  );
  return res.rows;
}

function buildPolicy(rows: DbRow[]): EffectivePolicy {
  const allow = new Set<string>();
  const deny = new Set<string>();
  const enabled = new Set<string>();
  for (const r of rows) {
    if (r.enabled) enabled.add(r.key);
    if (r.effect === "allow") allow.add(r.key);
    else deny.add(r.key);
  }
  return { allow, deny, enabled };
}

/**
 * Cache effective policy per user.
 * Invalidate via revalidateTag('auth:user:{id}') on membership/feature changes.
 */
export const getEffectivePolicy = (userId: string) =>
  unstable_cache(
    async () => buildPolicy(await fetchPolicyRows(userId)),
    ["authz-policy", userId],
    { tags: [`auth:user:${userId}`] },
  )();
