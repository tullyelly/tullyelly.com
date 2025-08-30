import { NextRequest, NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Commit", buildInfo.shortCommit);
  if (buildInfo.prNumber) res.headers.set("X-PR", String(buildInfo.prNumber));
  if (buildInfo.branch) res.headers.set("X-Ref", buildInfo.branch);
  res.headers.set("X-Built-At", buildInfo.buildIso);
  res.headers.set("X-Env", buildInfo.env);
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)',
  ],
};
