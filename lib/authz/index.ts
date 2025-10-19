/**
 * WU-377: Public API for feature gating
 * - Default deny
 * - Deny overrides allow
 * - Unknown feature => deny
 * - Feature must be enabled
 */
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { getEffectivePolicy } from "./resolve";
import {
  AuthzUnauthenticatedError,
  AuthzForbiddenError,
  type FeatureKey,
  type MustOptions,
  type EffectivePolicy,
} from "./types";

type UserLike = { id: string; authzRevision?: number } | null;

function evaluatePolicy(policy: EffectivePolicy, feature: FeatureKey): boolean {
  if (policy.deny.has(feature)) return false;
  if (policy.allow.has(feature) && policy.enabled.has(feature)) return true;
  return false;
}

export async function can(
  user: UserLike,
  feature: FeatureKey,
): Promise<boolean> {
  if (!user?.id) return false;
  const policy = await getEffectivePolicy(user.id);
  return evaluatePolicy(policy, feature);
}

async function mustForUser(
  user: UserLike,
  feature: FeatureKey,
  options?: MustOptions,
): Promise<void> {
  if (!user?.id) throw new AuthzUnauthenticatedError();

  const policy = await getEffectivePolicy(user.id);

  if (options?.strict) {
    const [row] = await sql<{ revision: number }>`
      SELECT dojo.authz_get_revision(${user.id}::uuid) AS revision
    `;
    const dbRevision = row?.revision ?? 0;
    const policyRevision = policy.revision ?? 0;
    if (policyRevision < dbRevision) {
      throw new AuthzForbiddenError();
    }
  }

  if (!evaluatePolicy(policy, feature)) {
    throw new AuthzForbiddenError();
  }
}

export async function must(
  user: UserLike,
  feature: FeatureKey,
  options?: MustOptions,
): Promise<void>;
export async function must(
  feature: FeatureKey,
  options?: MustOptions,
): Promise<void>;
export async function must(
  userOrFeature: UserLike | FeatureKey,
  featureOrOptions?: FeatureKey | MustOptions,
  maybeOptions?: MustOptions,
): Promise<void> {
  if (typeof userOrFeature === "string") {
    return mustCurrentUser(
      userOrFeature,
      featureOrOptions as MustOptions | undefined,
    );
  }
  return mustForUser(
    userOrFeature,
    featureOrOptions as FeatureKey,
    maybeOptions,
  );
}

// helpers for current request user
export async function canCurrentUser(feature: FeatureKey): Promise<boolean> {
  const u = await getCurrentUser();
  return can(u, feature);
}
export async function mustCurrentUser(
  feature: FeatureKey,
  options?: MustOptions,
): Promise<void> {
  const u = await getCurrentUser();
  return mustForUser(u, feature, options);
}
