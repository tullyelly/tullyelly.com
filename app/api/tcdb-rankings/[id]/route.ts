import { NextResponse } from "next/server";
import { getTcdbRanking } from "@/lib/data/tcdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const ranking = await getTcdbRanking(id);
  if (!ranking) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(ranking, {
    headers: { "Cache-Tag": "tcdb-rankings" },
  });
}
