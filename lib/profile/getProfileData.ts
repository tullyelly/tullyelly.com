import { getServerSession } from "next-auth/next";
import { authOptions, getPrisma } from "@/auth";
import { sql } from "@/lib/db";
import type {
  AuthzMembership,
  ProfileData,
  SanitizedAccount,
  SanitizedSession,
  SerializedUser,
  SessionSnapshot,
} from "@/types/profile";
import type { SessUser } from "@/lib/auth/session";
import type { Account, PrismaClient, Session, User } from "@prisma/client";

const REDACTED = "[REDACTED]";

type ProfileSnapshot = {
  user: SerializedUser | null;
  accounts: SanitizedAccount[];
  sessions: SanitizedSession[];
  memberships: AuthzMembership[];
  effectiveFeatures: string[];
  revision: number;
};

type ProfileViewRow = {
  user_id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  accounts: unknown;
  sessions: unknown;
  memberships: unknown;
  features: unknown;
  revision: number | null;
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .replace(/[{}]/g, "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

function toSerializedUserFromPrisma(user: User | null): SerializedUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
  };
}

function toSerializedUserFromView(row: ProfileViewRow): SerializedUser {
  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    image: row.image,
    emailVerified: null,
  };
}

function sanitizeAccountFromPrisma(account: Account): SanitizedAccount {
  return {
    provider: account.provider ?? null,
    providerAccountId: account.providerAccountId ?? null,
    type: account.type ?? null,
    scope: account.scope ?? null,
    expires_at: account.expires_at ? account.expires_at.toString() : null,
    id: account.id,
    userId: account.userId,
    refresh_token: account.refresh_token ? REDACTED : null,
    access_token: account.access_token ? REDACTED : null,
    id_token: account.id_token ? REDACTED : null,
  };
}

function sanitizeAccountFromView(
  account: Record<string, unknown>,
  userId: string,
): SanitizedAccount {
  return {
    provider: typeof account.provider === "string" ? account.provider : null,
    providerAccountId:
      typeof account.providerAccountId === "string"
        ? account.providerAccountId
        : null,
    type: typeof account.type === "string" ? account.type : null,
    scope: typeof account.scope === "string" ? account.scope : null,
    expires_at: toIsoString(account.expires_at) ?? null,
    userId,
  };
}

function sanitizeSessionFromPrisma(session: Session): SanitizedSession {
  return {
    userId: session.userId,
    sessionToken: REDACTED,
    expires: session.expires.toISOString(),
  };
}

function sanitizeSessionFromView(
  session: Record<string, unknown>,
  userId: string,
): SanitizedSession {
  return {
    userId,
    expires: toIsoString(session.expires) ?? "",
  };
}

function sanitizeMembership(row: Record<string, unknown>): AuthzMembership {
  return {
    userId:
      typeof row.user_id === "string"
        ? row.user_id
        : typeof row.userId === "string"
          ? row.userId
          : "",
    email: typeof row.email === "string" ? row.email : null,
    appSlug: typeof row.app_slug === "string" ? row.app_slug : "",
    role: typeof row.role === "string" ? row.role : "",
    grantedAt: toIsoString(row.granted_at) ?? null,
  };
}

function toSessionSnapshot(sessionUser: unknown): SessionSnapshot | null {
  if (!sessionUser || typeof sessionUser !== "object") return null;
  const raw = sessionUser as Record<string, unknown>;

  const features = Array.isArray(raw.features)
    ? raw.features.filter((item: unknown): item is string => {
        return typeof item === "string";
      })
    : [];
  return {
    id:
      typeof raw.id === "string"
        ? raw.id
        : typeof raw.sub === "string"
          ? raw.sub
          : null,
    email: typeof raw.email === "string" ? raw.email : null,
    name: typeof raw.name === "string" ? raw.name : null,
    image: typeof raw.image === "string" ? raw.image : null,
    role: typeof raw.role === "string" ? raw.role : "user",
    features,
    authzRevision:
      typeof raw.authzRevision === "number" ? raw.authzRevision : 0,
  };
}

async function fetchViaProfileView(
  userId: string,
): Promise<ProfileSnapshot | null> {
  const [row] = await sql<ProfileViewRow>`
    SELECT
      user_id,
      email,
      name,
      image,
      accounts,
      sessions,
      memberships,
      features,
      revision
    FROM dojo.v_user_profile
    WHERE user_id = ${userId}::uuid
  `;

  if (!row) return null;

  const accounts = Array.isArray(row.accounts)
    ? row.accounts
        .filter((value): value is Record<string, unknown> => {
          return value !== null && typeof value === "object";
        })
        .map((account) => sanitizeAccountFromView(account, row.user_id))
    : [];

  const sessions = Array.isArray(row.sessions)
    ? row.sessions
        .filter((value): value is Record<string, unknown> => {
          return value !== null && typeof value === "object";
        })
        .map((session) => sanitizeSessionFromView(session, row.user_id))
    : [];

  const memberships = Array.isArray(row.memberships)
    ? row.memberships
        .filter((value): value is Record<string, unknown> => {
          return value !== null && typeof value === "object";
        })
        .map((membership) => sanitizeMembership(membership))
    : [];

  const effectiveFeatures = Array.from(
    new Set(toStringArray(row.features)),
  ).sort();

  const revision =
    typeof row.revision === "number" ? row.revision : Number(row.revision ?? 0);

  return {
    user: toSerializedUserFromView(row),
    accounts,
    sessions,
    memberships,
    effectiveFeatures,
    revision: Number.isNaN(revision) ? 0 : revision,
  };
}

async function fetchViaPrisma(
  prisma: PrismaClient,
  currentUser: NonNullable<SessUser>,
): Promise<ProfileSnapshot> {
  const [user, accounts, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: currentUser.id } }),
    prisma.account.findMany({
      where: { userId: currentUser.id },
    }),
    prisma.session.findMany({
      where: { userId: currentUser.id },
    }),
  ]);

  const membershipsRows = await sql<{
    user_id: string;
    email: string | null;
    app_slug: string;
    role: string;
    granted_at: string | null;
  }>`
    SELECT user_id, email, app_slug, role, granted_at
    FROM dojo.v_authz_memberships
    WHERE user_id = ${currentUser.id}::uuid
    ORDER BY granted_at DESC
  `;

  const effectiveFeatureRows = await sql<{ feature_key: string }>`
    SELECT feature_key
    FROM dojo.v_authz_effective_features
    WHERE user_id = ${currentUser.id}::uuid
    ORDER BY feature_key
  `;

  const memberships: AuthzMembership[] = membershipsRows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    appSlug: row.app_slug,
    role: row.role,
    grantedAt: row.granted_at ? new Date(row.granted_at).toISOString() : null,
  }));

  const effectiveFeatures = Array.from(
    new Set(
      effectiveFeatureRows
        .map((row) => row.feature_key)
        .filter((value): value is string => typeof value === "string"),
    ),
  ).sort();

  return {
    user: toSerializedUserFromPrisma(user),
    accounts: accounts.map(sanitizeAccountFromPrisma),
    sessions: sessions.map(sanitizeSessionFromPrisma),
    memberships,
    effectiveFeatures,
    revision: currentUser.authzRevision ?? 0,
  };
}

async function countVerificationTokens(
  email: string | undefined,
): Promise<number> {
  if (!email) return 0;
  const [row] = await sql<{ total: number | string }>`
    SELECT COUNT(*)::int AS total
    FROM auth.verification_tokens
    WHERE identifier = ${email}
  `;
  const total =
    typeof row?.total === "number" ? row.total : Number(row?.total ?? 0);
  return Number.isNaN(total) ? 0 : total;
}

export async function getProfileData(
  currentUser: NonNullable<SessUser>,
): Promise<ProfileData> {
  const session = await getServerSession(authOptions);
  const sessionSnapshot = toSessionSnapshot(session?.user);

  let profile: ProfileSnapshot | null = null;
  try {
    profile = await fetchViaProfileView(currentUser.id);
  } catch (err) {
    profile = null;
  }

  if (!profile) {
    const prisma = getPrisma();
    profile = await fetchViaPrisma(prisma, currentUser);
  }

  if (!profile) {
    throw new Error("Profile data unavailable.");
  }

  const verificationTokenCount = await countVerificationTokens(
    currentUser.email,
  );

  return {
    ...profile,
    verificationTokenCount,
    revision: {
      db: profile.revision ?? 0,
      session: sessionSnapshot?.authzRevision ?? 0,
    },
    sessionSnapshot,
  };
}
