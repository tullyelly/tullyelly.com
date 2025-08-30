// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import buildInfo from "@/build-info.json";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Commit", buildInfo.commitShortSha);
  if (buildInfo.prNumber) res.headers.set("X-PR", String(buildInfo.prNumber));
  if (buildInfo.ref) res.headers.set("X-Ref", buildInfo.ref);
  res.headers.set("X-Built-At", buildInfo.builtAt);
  res.headers.set("X-Env", buildInfo.env);
  return res;
}

export const config = {
  matcher: "/:path*",
};
