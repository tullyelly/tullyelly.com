// app/api/__version/route.ts
import { NextResponse } from "next/server";
import buildInfo from "@/build-info.json" assert { type: "json" };

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(buildInfo);
}
