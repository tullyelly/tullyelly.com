import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token !== process.env.MENU_REVALIDATE_TOKEN) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const persona = url.searchParams.get("persona");
  if (persona) {
    revalidateTag(`menu:${persona}`);
  } else {
    revalidateTag("menu");
  }
  return NextResponse.json({
    ok: true,
    persona: persona ?? "*",
    revalidated: true,
  });
}
