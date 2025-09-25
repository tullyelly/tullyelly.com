/**
 * WU-377: Public API for feature gating
 * - Default deny
 * - Deny overrides allow
 * - Unknown feature => deny
 * - Feature must be enabled
 */
import { getCurrentUser } from "@/lib/auth/session";
import { getEffectivePolicy } from "./resolve";
import {
  AuthzUnauthenticatedError,
  AuthzForbiddenError,
  type FeatureKey,
} from "./types";

export async function can(
  user: { id: string } | null,
  feature: FeatureKey,
): Promise<boolean> {
  if (!user?.id) return false;
  const pol = await getEffectivePolicy(user.id);
  if (pol.deny.has(feature)) return false; // deny wins
  if (pol.allow.has(feature) && pol.enabled.has(feature)) return true;
  return false; // default deny + unknown key
}

export async function must(
  user: { id: string } | null,
  feature: FeatureKey,
): Promise<void> {
  if (!user?.id) throw new AuthzUnauthenticatedError();
  const ok = await can(user, feature);
  if (!ok) throw new AuthzForbiddenError();
}

// helpers for current request user
export async function canCurrentUser(feature: FeatureKey): Promise<boolean> {
  const u = await getCurrentUser();
  return can(u, feature);
}
export async function mustCurrentUser(feature: FeatureKey): Promise<void> {
  const u = await getCurrentUser();
  return must(u, feature);
}
