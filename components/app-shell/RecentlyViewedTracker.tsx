"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/nav";
import { flattenLinks } from "@/lib/menu.flatten";
import {
  isRecentRouteEligible,
  recordRecentVisit,
  titleForRecentDocument,
} from "@/lib/menu.recents";

export default function RecentlyViewedTracker({
  menuItems,
}: {
  menuItems: NavItem[];
}) {
  const pathname = usePathname();
  const menuByHref = React.useMemo(
    () => new Map(flattenLinks(menuItems).map((item) => [item.href, item])),
    [menuItems],
  );

  React.useEffect(() => {
    if (!pathname || !isRecentRouteEligible(pathname)) return;

    const frame = window.requestAnimationFrame(() => {
      if (document.querySelector("[data-recent-history-exclude]")) return;
      const menuItem = menuByHref.get(pathname);
      const title =
        menuItem?.label ?? titleForRecentDocument(globalThis.document.title);
      if (!title) return;

      recordRecentVisit({
        href: pathname,
        title,
        ...(menuItem?.persona?.label
          ? { category: menuItem.persona.label }
          : {}),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [menuByHref, pathname]);

  return null;
}
