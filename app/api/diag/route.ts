import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const env = serverEnv({ strict: true });
  return NextResponse.json(
    {
      ok: true,
      hasDbUrl: Boolean(env.DATABASE_URL),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
