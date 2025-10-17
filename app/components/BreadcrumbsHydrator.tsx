"use client";

import * as React from "react";
import BookmarkBreadcrumb from "@/components/breadcrumb/BookmarkBreadcrumb";
import type { Crumb } from "@/lib/breadcrumbs/types";
import {
  applyCrumbKinds,
  ensureSingleHome,
  humanizePathSegment,
  normalizePathForCrumbs,
} from "@/lib/breadcrumbs/utils";
import { usePathname } from "next/navigation";

type BreadcrumbsHydratorProps = {
  seed: Crumb[];
};

function createLabelLookup(
  seed: readonly Crumb[],
  pathname: string,
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const crumb of seed) {
    if (!crumb) continue;
    if (crumb.href) {
      lookup.set(normalizePathForCrumbs(crumb.href), crumb.label);
    }
  }
  if (seed.length) {
    lookup.set(normalizePathForCrumbs(pathname), seed[seed.length - 1]!.label);
  }
  lookup.set("/", seed.find((crumb) => crumb.href === "/")?.label ?? "Home");
  return lookup;
}

function buildClientCrumbs(pathname: string, seed: readonly Crumb[]): Crumb[] {
  if (seed.some((crumb) => crumb.kind === "forced")) {
    return seed.map((crumb, index, array) => ({
      ...crumb,
      kind: crumb.kind ?? "forced",
      href: index === array.length - 1 ? undefined : crumb.href,
    }));
  }
  const normalized = normalizePathForCrumbs(pathname);
  const lookup = createLabelLookup(seed, normalized);

  if (normalized === "/") {
    return applyCrumbKinds(ensureSingleHome([]));
  }

  const segments = normalized.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  const parts: string[] = [];

  segments.forEach((segment, index) => {
    parts.push(segment);
    const current = `/${parts.join("/")}`;
    const canonical = normalizePathForCrumbs(current);
    const label =
      lookup.get(canonical) ??
      humanizePathSegment(segment) ??
      segment.replace(/[-_]+/g, " ");
    crumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : canonical,
    });
  });

  const withHome = ensureSingleHome(crumbs);
  return applyCrumbKinds(withHome);
}

export default function BreadcrumbsHydrator({
  seed,
}: BreadcrumbsHydratorProps): React.ReactElement | null {
  const pathname = usePathname() ?? "/";
  const items = React.useMemo(
    () => buildClientCrumbs(pathname, seed),
    [pathname, seed],
  );

  if (!items.length) {
    return null;
  }

  return <BookmarkBreadcrumb items={items} />;
}
