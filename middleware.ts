// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isPublicPath, isProtectedPath, isOwnerOnlyPath, RULES } from "@/lib/auth-config";
import { buildInfo } from "@/lib/build-info";

function withBuildHeaders(res: NextResponse) {
  // Preserve build metadata headers on every response (including redirects)
  try {
    if (buildInfo?.shortCommit) res.headers.set("X-Commit", buildInfo.shortCommit);
    if (buildInfo?.prNumber) res.headers.set("X-PR", String(buildInfo.prNumber));
    if (buildInfo?.branch) res.headers.set("X-Ref", buildInfo.branch);
    if (buildInfo?.buildIso) res.headers.set("X-Built-At", buildInfo.buildIso);
    if (buildInfo?.env) res.headers.set("X-Env", buildInfo.env);
  } catch {
    // Non-fatal: never block the request due to header setting issues
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Extra guard if the matcher ever changes: skip framework internals/static
  if (
    pathname.startsWith("/_next") ||
    /\.[^/]+$/.test(pathname) // any "file.ext" at the end of the path
  ) {
    return withBuildHeaders(NextResponse.next());
  }

  // Public routes always pass; routes not listed as protected are public by default
  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return withBuildHeaders(NextResponse.next());
  }

  // Protected area → require a session (unless preview override is enabled)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isPreview = process.env.VERCEL_ENV === "preview";
  const allowAny = !!RULES.toggles?.allowAnyEmailOnPreview;

  if (!token) {
    if (isPreview && allowAny) {
      return withBuildHeaders(NextResponse.next());
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return withBuildHeaders(NextResponse.redirect(loginUrl));
  }

  // Owner-only sections → require owner role @ts-expect-error custom claim attached in NextAuth callbacks
  const role = token.role as "owner" | "user" | undefined;
  if (isOwnerOnlyPath(pathname) && role !== "owner") {
    return withBuildHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  return withBuildHeaders(NextResponse.next());
}

export const config = {
  // Your original matcher: runs on all paths except /api, /_next, and any path containing a dot (e.g., /file.css)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};