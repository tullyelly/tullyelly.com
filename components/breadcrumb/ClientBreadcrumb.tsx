"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Breadcrumb, { type Crumb } from "@/components/ui/breadcrumb";
import { breadcrumbDebug } from "@/lib/breadcrumb-debug";
import {
  deriveCrumbsFromPath,
  type MenuNode,
  mergeForcedCrumbs,
} from "@/lib/crumbs";

type ClientBreadcrumbProps = {
  initialItems: Crumb[];
  menuSnapshot: MenuNode;
  forceItems?: Crumb[] | null;
  className?: string;
};

const FORCED_ITEMS: Crumb[] = [
  { label: "home", href: "/" },
  { label: "debug", href: "/debug" },
  { label: "here" },
];

export default function ClientBreadcrumb({
  initialItems,
  menuSnapshot,
  forceItems,
  className,
}: ClientBreadcrumbProps) {
  const pathname = usePathname() || "/";
  const computed = React.useMemo(
    () => deriveCrumbsFromPath(menuSnapshot, pathname),
    [menuSnapshot, pathname],
  );

  const activeForced =
    forceItems ?? (breadcrumbDebug.force ? FORCED_ITEMS : undefined);

  const items =
    activeForced && activeForced.length
      ? mergeForcedCrumbs(
          activeForced,
          computed.length ? computed : initialItems,
        )
      : computed.length
        ? computed
        : initialItems;

  return <Breadcrumb items={items} className={className} />;
}
