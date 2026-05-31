import { NextResponse } from "next/server";
import { getTcdbClanRanking } from "@/lib/data/tcdb-clans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const ranking = await getTcdbClanRanking(slug);

  if (!ranking) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(ranking, {
    headers: { "Cache-Tag": "tcdb-rankings" },
  });
}
