import { NextResponse } from "next/server";
import { getAnalyticsRuntimeState } from "@/lib/analytics-archive/readiness";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;
/** State/catalog only. No authentication, session creation or collection. */
export async function GET() {
  return NextResponse.json(await getAnalyticsRuntimeState(), {
    headers: {
      "Cache-Control": "private, no-store",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
