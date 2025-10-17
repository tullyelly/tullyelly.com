"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import BookmarkBreadcrumb from "@/components/breadcrumb/BookmarkBreadcrumb";
import { useBreadcrumbs } from "@/components/breadcrumbs/useBreadcrumbs";
import type { Crumb } from "@/lib/breadcrumbs/types";
import {
  applyCrumbKinds,
  buildFallbackCrumbs,
  ensureSingleHome,
  normalizePathForCrumbs,
} from "@/lib/breadcrumbs/utils";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";

type BreadcrumbsProps = {
  forced?: Crumb[] | null;
  pathname?: string;
};

function normalizeForcedCrumbs(
  forced: Crumb[] | null | undefined,
): Crumb[] | null {
  if (!forced || forced.length === 0) {
    return null;
  }
  return forced.map((crumb, index, array) => ({
    ...crumb,
    kind: "forced",
    href: index === array.length - 1 ? undefined : crumb.href,
  }));
}

export default function Breadcrumbs({ forced, pathname }: BreadcrumbsProps) {
  const routerPathname = usePathname() ?? "/";
  const activePath = pathname ?? routerPathname;
  const normalizedPath = normalizePathForCrumbs(activePath);
  const forcedCrumbs = useMemo(() => normalizeForcedCrumbs(forced), [forced]);
  const trail = useBreadcrumbs(pathname);

  const items = useMemo<Crumb[]>(() => {
    if (forcedCrumbs?.length) {
      return forcedCrumbs;
    }

    if (!trail.length) {
      const fallback = buildFallbackCrumbs(normalizedPath);
      return applyCrumbKinds(ensureSingleHome(fallback));
    }

    const crumbs = trail.map((node, index) => {
      const isLast = index === trail.length - 1;
      const label =
        isLast && typeof node.resolveLabel === "function"
          ? node.resolveLabel(normalizedPath) || node.label
          : node.label;
      return {
        label,
        href: node.href ?? undefined,
      };
    });

    const withHome = ensureSingleHome(crumbs);
    return applyCrumbKinds(withHome);
  }, [forcedCrumbs, trail, normalizedPath]);

  const jsonLd = useMemo(() => {
    if (forcedCrumbs?.length || !items.length) {
      return null;
    }
    const linked = breadcrumbJsonLd(items);
    return linked.itemListElement.length ? linked : null;
  }, [forcedCrumbs, items]);

  if (!items.length) {
    return null;
  }

  return (
    <>
      <BookmarkBreadcrumb items={items} />
      {jsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </>
  );
}
