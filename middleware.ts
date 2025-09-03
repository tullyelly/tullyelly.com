// middleware.ts — NextAuth v4; rules-driven protection from AUTH_RULES_JSON
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getBuildInfoSync } from "@/lib/build-info";
import { RULES, isProtectedPath, isOwnerOnlyPath, emailIsOwner } from "./lib/auth-config";

// Note: Next.js requires `config.matcher` to be statically analyzable.
// We therefore use a broad, static matcher and do fine-grained checks
// in `authorized()` using AUTH_RULES_JSON from lib/auth-config.

export default withAuth(
  (req) => {
    const info = getBuildInfoSync();
    // Attach build metadata headers for e2e visibility
    const res = NextResponse.next();
    res.headers.set("x-commit", info.commit);
    res.headers.set("x-ref", info.branch);
    res.headers.set("x-built-at", info.builtAt);
    res.headers.set("x-env", process.env.VERCEL_ENV || process.env.NODE_ENV || "");
    return res;
  },
  {
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
  }
);

export const config = {
  // Run middleware for all non-static, non-API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
