export interface SerializedUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: string | null;
}

export interface SanitizedAccount {
  provider: string | null;
  providerAccountId: string | null;
  type: string | null;
  scope: string | null;
  expires_at: string | null;
  id?: string;
  userId?: string;
  refresh_token?: string | null;
  access_token?: string | null;
  id_token?: string | null;
}

export interface SanitizedSession {
  expires: string;
  userId?: string;
  sessionToken?: string;
}

export interface SessionSnapshot {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  features: string[];
  authzRevision: number;
}

export interface AuthzMembership {
  userId: string;
  email: string | null;
  appSlug: string;
  role: string;
  grantedAt: string | null;
}

export interface ProfileData {
  user: SerializedUser | null;
  accounts: SanitizedAccount[];
  sessions: SanitizedSession[];
  verificationTokenCount: number;
  memberships: AuthzMembership[];
  effectiveFeatures: string[];
  revision: {
    db: number;
    session: number;
  };
  sessionSnapshot: SessionSnapshot | null;
}
