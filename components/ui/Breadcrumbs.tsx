"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

type BreadcrumbItemData = {
  href: string;
  label: string;
};

function buildBreadcrumbItems(
  pathname: string | null,
  segments: readonly string[] | null,
): BreadcrumbItemData[] {
  const items: BreadcrumbItemData[] = [{ href: "/", label: "home" }];

  if (!pathname || pathname === "/") {
    return items;
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  let href = "";

  for (let index = 0; index < pathSegments.length; index += 1) {
    const seg = pathSegments[index] ?? "";
    href += `/${seg}`;

    const segmentValue = segments?.[index] ?? seg;
    items.push({ href, label: segmentLabel(String(segmentValue)) });
  }

  return items;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const selectedSegments = useSelectedLayoutSegments();

  const items = buildBreadcrumbItems(pathname, selectedSegments);
  const lastIndex = items.length - 1;

  return (
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              {index === lastIndex ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < lastIndex ? (
              <BreadcrumbSeparator>{` / `}</BreadcrumbSeparator>
            ) : null}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
