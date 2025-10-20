import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getMenuData } from "@/lib/menu/getMenu";
import { isPersonaKey, type PersonaKey } from "@/lib/menu/types";

/**
 * Enable by setting MENU_HEALTH_ENABLED="1" in Vercel env.
 * When disabled, route returns 404 and does nothing.
 * Force dynamic to ensure a real lambda invocation and fresh data.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  noStore();

  if (process.env.MENU_HEALTH_ENABLED !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Optional persona override: /api/menu/health?persona=mark2
  const url = new URL(request.url);
  const personaParam = url.searchParams.get("persona");
  const persona: PersonaKey = isPersonaKey(personaParam)
    ? personaParam
    : "mark2";

  // Grab the same payload the layout uses
  const { menu, children } = await getMenuData(persona);
  const menuChildren = children;

  // Summarize counts per persona
  const counts = Object.fromEntries(
    Object.entries(menuChildren).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.length : 0,
    ]),
  );

  // Emit a single clear log line for Vercel Logs
  console.error("[menu health]", {
    persona: menu?.persona ?? persona,
    counts,
  });

  // Optionally include a lightweight peek at the items for quick spot checks
  const sample = Object.fromEntries(
    Object.entries(menuChildren).map(([k, v]) => [
      k,
      (Array.isArray(v) ? v.slice(0, 3) : []).map((it) => ({
        id: it.id,
        label: it.label,
        href: it.href,
      })),
    ]),
  );

  return NextResponse.json({
    ok: true,
    persona: menu?.persona ?? persona,
    counts,
    sample,
  });
}
