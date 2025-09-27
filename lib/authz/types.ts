export type FeatureKey = string;

export type EffectivePolicy = {
  allow: Set<FeatureKey>;
  deny: Set<FeatureKey>;
  enabled: Set<FeatureKey>;
  revision: number;
};

export type MustOptions = {
  strict?: boolean;
};

export class AuthzUnauthenticatedError extends Error {
  status = 401 as const;
  constructor(msg = "Unauthenticated") {
    super(msg);
    this.name = "AuthzUnauthenticatedError";
  }
}
export class AuthzForbiddenError extends Error {
  status = 403 as const;
  constructor(msg = "Forbidden") {
    super(msg);
    this.name = "AuthzForbiddenError";
  }
}
