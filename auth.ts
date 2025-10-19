// auth.ts  (NextAuth v4 helper config)

import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { getAuthzRevision, getEffectiveFeatures } from "@/app/_auth/policy";

declare global {
  var __PRISMA_CLIENT__: PrismaClient | undefined;
}

let prisma: PrismaClient | undefined = global.__PRISMA_CLIENT__;

export function getPrisma(): PrismaClient {
  if (process.env.SKIP_DB === "true") {
    throw new Error("Prisma access disabled when SKIP_DB=true.");
  }
  if (!prisma) {
    prisma = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.__PRISMA_CLIENT__ = prisma;
    }
  }
  return prisma;
}

// Optional domain gate
const OWNER_ONLY = process.env.OWNER_ONLY === "true";
const OWNER_DOMAIN = (
  process.env.OWNER_DOMAIN ?? "tullyelly.com"
).toLowerCase();

type TokenWithAuthz = JWT & {
  features?: string[];
  authzRevision?: number;
};

async function applyEffectiveFeatures(
  token: TokenWithAuthz,
  userId: string | undefined,
  refresh: boolean,
): Promise<void> {
  if (process.env.SKIP_DB === "true") {
    return;
  }
  if (!userId) return;

  let needsRefresh = refresh;

  if (!needsRefresh && Array.isArray(token.features)) {
    const currentRevision = await getAuthzRevision(userId);
    if ((token.authzRevision ?? 0) !== currentRevision) {
      needsRefresh = true;
    }
  }

  if (!needsRefresh) {
    return;
  }

  const snapshot = await getEffectiveFeatures(userId);
  token.features = snapshot.features;
  token.authzRevision = snapshot.revision;
}

/**
 * Exported v4 options for reuse in the Route Handler:
 *   import NextAuth from "next-auth";
 *   import { authOptions } from "@/auth";
 *   const handler = NextAuth(authOptions);
 *   export { handler as GET, handler as POST };
 */
export const authOptions: NextAuthOptions = {
  // v4 env names
  // Prefer NEXTAUTH_SECRET, but fall back to AUTH_SECRET so local envs created by `npx auth` keep working.
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  // Use JWT sessions so NextAuth middleware can authorize requests.
  // We still keep the Prisma adapter for users/accounts persistence.
  ...(process.env.SKIP_DB === "true"
    ? {}
    : { adapter: PrismaAdapter(getPrisma()) }),
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    // Optional: route built-in sign-in to your /login page
    signIn: "/login",
  },

  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const domain = profile.email.split("@")[1]?.toLowerCase();
      return OWNER_ONLY ? domain === OWNER_DOMAIN : true;
    },

    // Persist useful fields on the JWT so middleware/session can read them
    async jwt({ token, user, trigger }) {
      const mutableToken = token as TokenWithAuthz;

      // On initial sign-in, merge user details into the token
      if (user) {
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = (user as any).image ?? (token as any).picture;
      }

      const inferredUserId =
        (user as any)?.id ?? (token.sub as string | undefined) ?? undefined;
      const shouldRefresh =
        !!user || trigger === "signIn" || trigger === "update";
      await applyEffectiveFeatures(mutableToken, inferredUserId, shouldRefresh);

      // Derive role from email domain
      // Feature gating ignores this value; DB-backed capabilities (can()/must()) decide access.
      const email = (token.email ?? "").toLowerCase();
      const domain = email.split("@")[1] ?? "";
      (mutableToken as any).role = domain === OWNER_DOMAIN ? "owner" : "user";
      return mutableToken;
    },

    async session({ session, token }) {
      const mutableToken = token as TokenWithAuthz;
      // Ensure session has email/name/picture reflected from the token
      if (session.user) {
        session.user.email =
          session.user.email ?? (token.email as string | null) ?? undefined;
        session.user.name =
          session.user.name ?? (token.name as string | undefined);
        (session.user as any).image =
          (session as any).user?.image ?? (token as any).picture;
        // Expose derived role to the client session
        (session.user as any).role = (mutableToken as any).role ?? "user";
        (session.user as any).id =
          (token.sub as string | undefined) ?? (token as any).id ?? null;
        (session.user as any).features = Array.isArray(mutableToken.features)
          ? mutableToken.features
          : [];
        (session.user as any).authzRevision = mutableToken.authzRevision ?? 0;
      }
      return session;
    },
  },
};
