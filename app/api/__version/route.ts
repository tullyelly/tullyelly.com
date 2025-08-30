import { NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, ...buildInfo });
}
