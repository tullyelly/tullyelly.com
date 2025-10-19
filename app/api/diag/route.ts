import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      env: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL ?? null,
      site_url: process.env.SITE_URL ?? null,
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
