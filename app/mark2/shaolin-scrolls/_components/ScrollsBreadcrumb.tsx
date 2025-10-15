"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import BookmarkBreadcrumb, {
  type Crumb,
  toTitle,
} from "@/components/BookmarkBreadcrumb";
import { cn } from "@/lib/utils";
import styles from "./ScrollsBreadcrumb.module.css";
import { useBreadcrumbSlotController } from "@/components/app-shell/BreadcrumbSlotContext";

type ScrollsBreadcrumbProps = {
  currentLabel?: string;
  sticky?: boolean;
  className?: string;
};

function buildItems(pathname: string | null, currentLabel?: string): Crumb[] {
  if (!pathname || pathname === "/") {
    return [];
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  const items: Crumb[] = [{ label: "home", href: "/" }];
  let href = "";

  segments.forEach((segment, index) => {
    href += `/${segment}`;
    const label =
      index === segments.length - 1
        ? (currentLabel ?? toTitle(segment))
        : toTitle(segment);

    if (index === segments.length - 1) {
      items.push({ label });
    } else {
      items.push({ label, href });
    }
  });

  return items;
}

export default function ScrollsBreadcrumb({
  currentLabel,
  sticky = true,
  className,
}: ScrollsBreadcrumbProps) {
  const pathname = usePathname();
  const breadcrumbController = useBreadcrumbSlotController();

  const items = React.useMemo(
    () => buildItems(pathname, currentLabel),
    [pathname, currentLabel],
  );

  const breadcrumbNode = React.useMemo(
    () => (
      <BookmarkBreadcrumb
        items={items}
        sticky={sticky}
        className={cn(styles.root, className)}
      />
    ),
    [items, sticky, className],
  );

  React.useEffect(() => {
    if (!breadcrumbController) {
      return;
    }
    breadcrumbController.setOverride(breadcrumbNode);
    return () => breadcrumbController.setOverride(null);
  }, [breadcrumbController, breadcrumbNode]);

  if (breadcrumbController) {
    return null;
  }

  return breadcrumbNode;
}
