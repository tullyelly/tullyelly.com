"use client";

import * as React from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import BookmarkBreadcrumb, {
  type Crumb,
  toTitle,
} from "@/components/BookmarkBreadcrumb";

type LabelMap = Record<string, string>;

const LABELS: LabelMap = {
  // Extend with friendly labels as needed
  // "tullyelly": "tullyelly",
  // "cardattack": "cardattack",
  // "mark2": "mark2",
};

function segmentLabel(segment: string): string {
  const normalized = segment || "";
  const lookup = LABELS[normalized];
  if (lookup) return lookup;
  return toTitle(normalized);
}

function buildBreadcrumbItems(
  pathname: string | null,
  segments: readonly string[] | null,
  finalLabelOverride?: string,
): Crumb[] {
  if (!pathname || pathname === "/" || pathname === "/mark2/shaolin-scrolls") {
    return [];
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const items: Crumb[] = [{ href: "/", label: "home" }];
  let href = "";

  for (let index = 0; index < pathSegments.length; index += 1) {
    const seg = pathSegments[index] ?? "";
    href += `/${seg}`;
    const segmentValue = segments?.[index] ?? seg;
    items.push({ href, label: segmentLabel(String(segmentValue)) });
  }

  const lastIndex = items.length - 1;
  if (lastIndex >= 0) {
    items[lastIndex] = {
      label: finalLabelOverride ?? items[lastIndex]?.label ?? "",
    };
  }

  return items;
}

type BreadcrumbsProps = {
  currentLabelOverride?: string;
  sticky?: boolean;
  className?: string;
};

export default function Breadcrumbs({
  currentLabelOverride,
  sticky = false,
  className,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const selectedSegments = useSelectedLayoutSegments();

  const items = React.useMemo(
    () =>
      buildBreadcrumbItems(pathname, selectedSegments, currentLabelOverride),
    [pathname, selectedSegments, currentLabelOverride],
  );

  if (items.length <= 1) {
    return null;
  }

  return (
    <BookmarkBreadcrumb items={items} sticky={sticky} className={className} />
  );
}
