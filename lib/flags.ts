export const flags = {
  breadcrumbsV1:
    process.env.NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1 === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_FEATURE_BREADCRUMBS_V1 !== "false"),
};

export type FeatureFlags = typeof flags;
