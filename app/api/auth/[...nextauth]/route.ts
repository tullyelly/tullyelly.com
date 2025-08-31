import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";

const OWNER_DOMAIN = (process.env.OWNER_DOMAIN ?? "tullyelly.com").toLowerCase();
const OWNER_ONLY = process.env.AUTH_OWNER_ONLY === "true";

// Make this route dynamic and Node runtime
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const authSetup = NextAuth(async () => {
  // Lazy import to avoid touching the DB during build
  const { pool } = await import("@/lib/pool");

  return {
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    adapter: PostgresAdapter(pool),
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    callbacks: {
      async signIn({ profile }) {
        if (!profile?.email) return false;
        const domain = profile.email.split("@")[1]?.toLowerCase();
        if (OWNER_ONLY && domain !== OWNER_DOMAIN) return false;
        return true;
      },
      async jwt({ token, profile }) {
        const email = (profile?.email || token.email || "").toLowerCase();
        const domain = email.split("@")[1] ?? "";
        (token as any).role = domain === OWNER_DOMAIN ? "owner" : "user";
        return token;
      },
      async session({ session, token }) {
        (session.user as any).role = (token as any).role ?? "user";
        return session;
      },
    },
  };
});

export const GET = authSetup.handlers.GET;
export const POST = authSetup.handlers.POST;