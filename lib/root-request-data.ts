import "server-only";

import { getCapabilities } from "@/app/_auth/session";
import { isBreadcrumbDebugAllowed } from "@/lib/escape-hatches";
import { getMenu } from "@/lib/menu/getMenu";
import { resolvePersonaForPath } from "@/lib/menu/persona";
import { buildMenuTree } from "@/lib/menu/tree";
import type { PersonaKey } from "@/lib/menu/types";
import { headers } from "next/headers";
import { cache } from "react";

export function resolveRequestedPath(headersList: Headers): string {
  const candidates = [
    headersList.get("x-pathname"),
    headersList.get("next-url"),
    headersList.get("x-invoke-path"),
    headersList.get("x-matched-path"),
  ];
  const match = candidates.find((value) => value && value.startsWith("/"));
  return match ?? "/";
}

function isBreadcrumbDebugForced(headersList: Headers): boolean {
  if (!isBreadcrumbDebugAllowed()) return false;
  try {
    const candidate =
      headersList.get("x-next-url") || headersList.get("x-invoke-path") || null;
    if (!candidate) return false;
    const url = new URL(candidate, "http://localhost");
    return url.searchParams.get("debugBreadcrumb") === "1";
  } catch {
    return false;
  }
}

async function loadRootRequestData() {
  const [headersList, menu, capabilities] = await Promise.all([
    headers(),
    getMenu(),
    getCapabilities(),
  ]);
  const pathname = resolveRequestedPath(headersList);
  const currentPersona = resolvePersonaForPath(menu.tree, pathname);

  return {
    pathname,
    menu,
    menuTree: buildMenuTree(menu.tree),
    capabilities,
    currentPersona,
    personaKey: (currentPersona?.persona ?? "mark2") as PersonaKey,
    breadcrumbDebugForced: isBreadcrumbDebugForced(headersList),
  };
}

// Metadata and the root layout render separately, but share one request cache.
// Keep sessions and capabilities out of any cross-request cache.
export const getRootRequestData = cache(loadRootRequestData);
