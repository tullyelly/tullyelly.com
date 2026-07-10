import {
  isBreadcrumbDebugAllowed,
  isBreadcrumbDebugForceEnabled,
} from "@/lib/escape-hatches";

export const breadcrumbDebug = {
  get force(): boolean {
    if (!isBreadcrumbDebugAllowed()) return false;
    if (typeof window === "undefined") {
      return isBreadcrumbDebugForceEnabled();
    }
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("debugBreadcrumb") === "1";
    } catch {
      return false;
    }
  },
};
