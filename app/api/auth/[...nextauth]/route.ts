import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "@/lib/pool";

const OWNER_DOMAIN = (process.env.OWNER_DOMAIN ?? "tullyelly.com").toLowerCase();
const OWNER_ONLY = process.env.AUTH_OWNER_ONLY === "true";

const authSetup = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },

  adapter: PostgresAdapter(pool),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // authorization: { params: { hd: OWNER_DOMAIN } }, // optional UI hint
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
});

// Export ONLY what Next.js route modules allow
export const GET = authSetup.handlers.GET;
export const POST = authSetup.handlers.POST;
export const runtime = "nodejs";