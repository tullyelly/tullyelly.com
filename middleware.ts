// middleware.ts — NextAuth v4; rules-driven protection from AUTH_RULES_JSON
import { withAuth } from "next-auth/middleware";
import {
  RULES,
  isProtectedPath,
  isOwnerOnlyPath,
  emailIsOwner,
} from "./lib/auth-config";

// Build matcher from configured protected + owner-only paths at build time
const basePrefixes = Array.from(
  new Set([...(RULES.protectedPaths || []), ...(RULES.ownerOnlyPaths || [])].map((p) => p.replace(/\/+$/, "")))
);
const matchers = basePrefixes.flatMap((base) => [base, `${base}/:path*`]);

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;

      // Only enforce auth on protected paths
      if (!isProtectedPath(pathname)) return true;

      // Require a valid session token for any protected path
      if (!token) return false;

      // Owner-only segments require owner email (unless preview override is on)
      if (isOwnerOnlyPath(pathname)) {
        const email = (token as any)?.email as string | undefined;
        const allowAnyEmail = !!RULES.toggles?.allowAnyEmailOnPreview && process.env.VERCEL_ENV !== "production";
        return allowAnyEmail ? true : emailIsOwner(email);
      }

      // Authenticated; allow
      return true;
    },
  },
});

export const config = {
  matcher: matchers,
};
