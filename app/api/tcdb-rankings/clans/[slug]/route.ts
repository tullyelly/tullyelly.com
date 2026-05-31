import { NextResponse } from "next/server";
import { getTcdbClanRankingsBySlug } from "@/lib/data/tcdb-clans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const rankings = await getTcdbClanRankingsBySlug(slug);

  if (rankings.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: rankings,
      meta: { slug: rankings[0]?.slug ?? slug, total: rankings.length },
    },
    {
      headers: { "Cache-Tag": "tcdb-rankings" },
    },
  );
}
