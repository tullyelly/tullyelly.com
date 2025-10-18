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
  suppressed?: boolean;
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

export default function Breadcrumbs({
  forced,
  pathname,
  suppressed = false,
}: BreadcrumbsProps) {
  const routerPathname = usePathname() ?? "/";
  const activePath = pathname ?? routerPathname;
  const normalizedPath = normalizePathForCrumbs(activePath);
  const forcedCrumbs = useMemo(() => normalizeForcedCrumbs(forced), [forced]);
  const trail = useBreadcrumbs(pathname);

  const rawItems = useMemo<Crumb[]>(() => {
    if (suppressed) {
      return [];
    }

    if (forcedCrumbs?.length) {
      return forcedCrumbs;
    }

    if (!trail.length) {
      const fallback = buildFallbackCrumbs(normalizedPath);
      return applyCrumbKinds(ensureSingleHome(fallback));
    }

    const menuCrumbs = trail.map((node, index) => {
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

    const withHome = ensureSingleHome([
      { label: "Home", href: "/" },
      ...menuCrumbs,
    ]);
    return applyCrumbKinds(withHome);
  }, [forcedCrumbs, trail, normalizedPath, suppressed]);

  const items = useMemo<Crumb[]>(() => {
    if (suppressed) {
      return [];
    }

    if (!rawItems.length) {
      return [];
    }

    const [first, ...rest] = rawItems;
    const firstLabel =
      typeof first.label === "string" ? first.label.trim().toLowerCase() : "";
    const hrefIsHome = first.href === "/";
    const labelIsHome = firstLabel === "home";
    const isHomeCrumb = hrefIsHome || labelIsHome;
    const homeKind =
      first.kind === "forced" && isHomeCrumb ? first.kind : "root";
    const baseHome: Crumb = {
      ...first,
      label: "home",
      href: "/",
      kind: homeKind,
    };

    if (isHomeCrumb) {
      return [baseHome, ...rest];
    }

    const normalizedTail = rawItems.map((crumb, index) => {
      if (index === 0 && crumb.kind !== "forced") {
        return { ...crumb, kind: undefined };
      }
      return crumb;
    });

    return applyCrumbKinds([baseHome, ...normalizedTail]);
  }, [rawItems, suppressed]);

  const jsonLd = useMemo(() => {
    if (suppressed || forcedCrumbs?.length || !items.length) {
      return null;
    }
    const linked = breadcrumbJsonLd(items);
    return linked.itemListElement.length ? linked : null;
  }, [suppressed, forcedCrumbs, items]);

  return (
    <>
      <BookmarkBreadcrumb
        items={items}
        skeleton={suppressed || !items.length}
      />
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
