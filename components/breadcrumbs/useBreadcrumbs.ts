"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { MenuNode } from "@/lib/menu/tree";
import { useMenuTree } from "@/components/menu/MenuProvider";
import { normalizePathForCrumbs } from "@/lib/breadcrumbs/utils";

function normalizeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  if (!href.startsWith("/")) return null;
  const trimmed = href.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

function findTrail(tree: MenuNode[], pathname: string): MenuNode[] {
  const normalizedPath = normalizePathForCrumbs(pathname);
  let best: MenuNode[] = [];

  const dfs = (nodes: MenuNode[] | undefined, trail: MenuNode[]) => {
    if (!nodes?.length) return;

    for (const node of nodes) {
      if (!node) continue;
      const nextTrail = [...trail, node];
      const href = normalizeHref(node.href);
      const isRoot = href === "/";
      const isMatch =
        typeof href === "string" && href.length
          ? normalizedPath === href || normalizedPath.startsWith(`${href}/`)
          : false;
      if ((isRoot || isMatch) && nextTrail.length >= best.length) {
        best = nextTrail;
      }
      if (node.children?.length) {
        dfs(node.children, nextTrail);
      }
    }
  };

  dfs(tree, []);
  return best;
}

export function useBreadcrumbs(pathOverride?: string): MenuNode[] {
  const pathname = usePathname();
  const activePath = pathOverride ?? pathname ?? "/";
  const normalizedPath = normalizePathForCrumbs(activePath);
  const tree = useMenuTree();
  return useMemo(() => {
    const trail = findTrail(tree, normalizedPath);
    if (!trail.length) {
      return [];
    }

    const [first, ...rest] = trail;
    if (first.kind !== "persona") {
      return trail;
    }

    const landingCandidate =
      first.children?.find((child) => !!child?.href)?.href ?? first.href;
    const landingHref = normalizeHref(landingCandidate);
    const normalizedLanding = landingHref
      ? normalizePathForCrumbs(landingHref)
      : null;
    const personaCrumb: MenuNode =
      landingHref && normalizedLanding
        ? { ...first, href: normalizedLanding }
        : first;

    if (normalizedLanding && normalizedLanding === normalizedPath) {
      return [personaCrumb];
    }

    const deepest = rest.length ? rest[rest.length - 1] : null;
    if (deepest) {
      return [personaCrumb, deepest];
    }

    return [personaCrumb];
  }, [tree, normalizedPath]);
}
