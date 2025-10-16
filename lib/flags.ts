function resolveBreadcrumbFlag(): boolean {
  const rawPublic = process.env.NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1;
  const rawServer =
    typeof window === "undefined"
      ? process.env.FEATURE_BREADCRUMBS_V1
      : undefined;

  const configured = rawPublic ?? rawServer;
  const isProduction = process.env.NODE_ENV === "production";

  if (configured === "true") {
    return true;
  }
  if (configured === "false") {
    return false;
  }

  return !isProduction;
}

export const flags = {
  breadcrumbsV1: resolveBreadcrumbFlag(),
};

export type FeatureFlags = typeof flags;
