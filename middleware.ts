// middleware.ts — NextAuth v4; rules-driven protection from AUTH_RULES_JSON
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";
import { RULES, isProtectedPath, isOwnerOnlyPath, emailIsOwner } from "./lib/auth-config";

// Note: Next.js requires `config.matcher` to be statically analyzable.
// We therefore use a broad, static matcher and do fine-grained checks
// in `authorized()` using AUTH_RULES_JSON from lib/auth-config.

export default withAuth(
  (req) => {
    // Attach build metadata headers for e2e visibility
    const res = NextResponse.next();
    res.headers.set("x-commit", buildInfo.commit);
    res.headers.set("x-ref", buildInfo.branch);
    res.headers.set("x-built-at", buildInfo.buildIso);
    res.headers.set("x-env", buildInfo.env);
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
