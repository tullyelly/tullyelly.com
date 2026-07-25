import { NextResponse } from "next/server";
import { listHomieDirectory } from "@/lib/data/homies";

export const runtime = "nodejs";

export async function GET(_request?: Request) {
  const data = await listHomieDirectory();
  return NextResponse.json(
    { data, meta: { total: data.length } },
    { headers: { "Cache-Tag": "homies" } },
  );
}
