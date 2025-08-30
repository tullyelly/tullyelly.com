import { NextResponse } from "next/server";
import { Env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      hasDbUrl: Boolean(Env.DATABASE_URL),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
