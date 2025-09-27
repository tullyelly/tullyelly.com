// auth.ts  (NextAuth v4 helper config)

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// Use one shared Prisma client (Node runtime only)
export const prisma = new PrismaClient();

// Optional domain gate
const OWNER_ONLY = process.env.OWNER_ONLY === "true";
const OWNER_DOMAIN = (
  process.env.OWNER_DOMAIN ?? "tullyelly.com"
).toLowerCase();

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
  adapter: PrismaAdapter(prisma),
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
    async jwt({ token, user }) {
      // On initial sign-in, merge user details into the token
      if (user) {
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = (user as any).image ?? (token as any).picture;
      }

      // Derive role from email domain
      // Feature gating ignores this value; DB-backed capabilities (can()/must()) decide access.
      const email = (token.email ?? "").toLowerCase();
      const domain = email.split("@")[1] ?? "";
      (token as any).role = domain === OWNER_DOMAIN ? "owner" : "user";
      return token;
    },

    async session({ session, token }) {
      // Ensure session has email/name/picture reflected from the token
      if (session.user) {
        session.user.email =
          session.user.email ?? (token.email as string | null) ?? undefined;
        session.user.name =
          session.user.name ?? (token.name as string | undefined);
        (session.user as any).image =
          (session as any).user?.image ?? (token as any).picture;
        // Expose derived role to the client session
        (session.user as any).role = (token as any).role ?? "user";
        (session.user as any).id =
          (token.sub as string | undefined) ?? (token as any).id ?? null;
      }
      return session;
    },
  },
};
