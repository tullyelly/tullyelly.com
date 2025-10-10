import type { FeatureGate } from "@/lib/menu/buildMenu";

type CapabilitySet = {
  has(key: string): boolean;
};

type FeatureChecker = (feature: string) => Promise<boolean> | boolean;

/**
 * Builds a feature gate that trusts the session's capability snapshot first and
 * falls back to the live authz check when the snapshot does not include the key.
 */
export function createFeatureGate(
  capabilities: CapabilitySet,
  fallback: FeatureChecker,
): FeatureGate {
  const cache = new Map<string, Promise<boolean>>();

  return (feature: string): Promise<boolean> => {
    if (!feature) {
      return Promise.resolve(false);
    }

    const cached = cache.get(feature);
    if (cached) {
      return cached;
    }

    if (capabilities.has(feature)) {
      const allowed = Promise.resolve(true);
      cache.set(feature, allowed);
      return allowed;
    }

    const decision = Promise.resolve(fallback(feature))
      .then(Boolean)
      .catch(() => false);
    cache.set(feature, decision);
    return decision;
  };
}
