import { NextResponse, NextRequest } from "next/server";
import { getMenuData } from "@/lib/menu/getMenu";
import { isPersonaKey } from "@/lib/menu/types";
import type { PersonaKey } from "@/lib/menu/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const personaParam = searchParams.get("persona");
  const persona: PersonaKey = isPersonaKey(personaParam)
    ? personaParam
    : "mark2";

  const payload = await getMenuData(persona);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
