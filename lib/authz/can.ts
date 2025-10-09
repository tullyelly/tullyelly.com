import { getCurrentUser } from "@/lib/auth/session";
import { can as canForUser } from "@/lib/authz";
import type { FeatureKey } from "./types";

export async function can(feature: FeatureKey): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return canForUser(user, feature);
  } catch {
    return false;
  }
}
