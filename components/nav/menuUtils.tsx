import * as React from "react";
import * as Lucide from "lucide-react";
import type { NavItem } from "@/types/nav";

export type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;

export function Icon({
  name,
  className,
  fallback,
}: {
  name?: string;
  className?: string;
  fallback?: string;
}): React.ReactNode {
  const iconName = name && name in Lucide ? name : fallback;
  if (!iconName) return null;
  const maybeIcon = Lucide[iconName as keyof typeof Lucide];
  if (!maybeIcon) return null;
  const IconComponent = maybeIcon as React.ElementType;
  return <IconComponent className={className} aria-hidden="true" />;
}

export function normalizePath(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

export function isActiveHref(pathname: string, href?: string | null): boolean {
  if (!href) return false;
  try {
    return normalizePath(pathname) === normalizePath(href);
  } catch {
    return false;
  }
}

export function readHotkey(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.hotkey || node.hotkey;
}
