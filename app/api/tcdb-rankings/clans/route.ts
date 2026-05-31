import { NextResponse } from "next/server";
import { listTcdbClanRankings } from "@/lib/data/tcdb-clans";
import { isTrend } from "@/lib/data/tcdb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const q = searchParams.get("q") ?? undefined;
  const trendParam = searchParams.get("trend");
  const trend = isTrend(trendParam) ? trendParam : undefined;

  const data = await listTcdbClanRankings({ page, pageSize, q, trend });
  return NextResponse.json(data, { headers: { "Cache-Tag": "tcdb-rankings" } });
}
