"use server";

import "server-only";

import { getMenu } from "@/app/_menu/getMenu";
import type { Crumb } from "@/lib/breadcrumbs/types";
import {
  applyCrumbKinds,
  buildFallbackCrumbs,
  ensureSingleHome,
  normalizePathForCrumbs,
} from "@/lib/breadcrumbs/utils";
import { getBreadcrumbs } from "@/lib/menu.breadcrumbs";

function trimTrailingHref(crumbs: readonly Crumb[]): Crumb[] {
  return crumbs.map((crumb, index, array) => {
    if (index === array.length - 1) {
      const { href, ...rest } = crumb;
      return { ...rest };
    }
    return { ...crumb };
  });
}

export async function buildCrumbs(pathname: string): Promise<Crumb[]> {
  const normalized = normalizePathForCrumbs(pathname);
  const { index } = await getMenu();

  const menuCrumbs = getBreadcrumbs(normalized, index).map((crumb) => ({
    label: crumb.label,
    href: crumb.href,
  }));

  const preferred = menuCrumbs.length
    ? applyCrumbKinds(ensureSingleHome(trimTrailingHref(menuCrumbs)))
    : [];

  if (preferred.length) {
    return preferred;
  }

  const fallback = buildFallbackCrumbs(normalized);
  return applyCrumbKinds(fallback);
}
