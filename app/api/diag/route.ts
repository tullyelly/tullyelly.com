import { NextResponse } from "next/server";
import { env } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      env: env.NODE_ENV,
      vercel_url: env.VERCEL_URL ?? null,
      site_url: env.SITE_URL ?? null,
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
