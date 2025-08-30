import { NextResponse } from "next/server";
import { NODE_ENV, VERCEL_URL, SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      env: NODE_ENV,
      vercel_url: VERCEL_URL ?? null,
      site_url: SITE_URL ?? null,
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
