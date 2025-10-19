export const breadcrumbDebug = {
  get force(): boolean {
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_BC_FORCE === "true";
    }
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("debugBreadcrumb") === "1";
    } catch {
      return false;
    }
  },
};
