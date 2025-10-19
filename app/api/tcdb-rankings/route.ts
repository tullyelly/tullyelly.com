import { NextResponse } from "next/server";
import { listTcdbRankings, type Trend } from "@/lib/data/tcdb";

// Neon supports edge, but use Node for parity with other data entrypoints if preferred.
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const q = searchParams.get("q") ?? undefined;
  const trend = (searchParams.get("trend") as Trend | null) ?? undefined;

  const data = await listTcdbRankings({ page, pageSize, q, trend });
  return NextResponse.json(data, { headers: { "Cache-Tag": "tcdb-rankings" } });
}
