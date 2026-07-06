import { NextResponse } from "next/server";
import { isTrend, listTcdbRankings } from "@/lib/data/tcdb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const q = searchParams.get("q") ?? undefined;
  const trendParam = searchParams.get("trend");
  const trend = isTrend(trendParam) ? trendParam : undefined;

  const data = await listTcdbRankings({ page, pageSize, q, trend });
  return NextResponse.json(data, { headers: { "Cache-Tag": "tcdb-rankings" } });
}
