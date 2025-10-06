import type { NavItem } from "@/types/nav";
import type { MenuIndex } from "@/lib/menu.index";
import { __normalizeMenuPath } from "@/lib/menu.index";

export type Breadcrumb = {
  label: string;
  href: string;
};

function getItemLabel(item: NavItem): string {
  const anyItem = item as NavItem & { segmentLabel?: string };
  return anyItem.segmentLabel && anyItem.segmentLabel.trim().length
    ? anyItem.segmentLabel
    : item.label;
}

function humanizeSegment(segment: string): string {
  if (!segment) return "";
  const decoded = decodeURIComponent(segment);
  const replaced = decoded.replace(/[-_]+/g, " ");
  return replaced.replace(/\b\w/g, (char) => char.toUpperCase());
}

function trimPath(path: string): string | null {
  if (path === "/") return null;
  const idx = path.lastIndexOf("/");
  if (idx <= 0) return "/";
  const next = path.slice(0, idx);
  return next.length ? next : "/";
}

function findNearestPath(path: string, index: MenuIndex): string | null {
  let current: string | null = path;
  while (current) {
    if (index.byPath.has(current)) return current;
    const next = trimPath(current);
    if (next === current) break;
    current = next;
  }
  return null;
}

export function getSegmentAwareLabel(
  pathname: string,
  index: MenuIndex,
): string {
  const normalized = __normalizeMenuPath(pathname);
  if (!normalized) {
    return pathname;
  }

  const item = index.byPath.get(normalized);
  if (item) {
    const label = getItemLabel(item);
    if (label) return label;
  }

  if (normalized === "/") return "Home";
  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return "Home";
  return humanizeSegment(segments[segments.length - 1]);
}

export function getBreadcrumbs(
  pathname: string,
  index: MenuIndex,
): Breadcrumb[] {
  const normalized = __normalizeMenuPath(pathname);
  if (!normalized) return [];

  const crumbs: Breadcrumb[] = [];
  const nearest = findNearestPath(normalized, index);

  if (nearest) {
    const ancestors: string[] = [];
    let cursor: string | null = nearest;
    const guard = new Set<string>();
    while (cursor) {
      if (guard.has(cursor)) break;
      guard.add(cursor);
      ancestors.push(cursor);
      cursor = index.parents.get(cursor) ?? null;
    }
    ancestors.reverse();

    for (const href of ancestors) {
      const label = getSegmentAwareLabel(href, index);
      if (!label) continue;
      if (crumbs.some((crumb) => crumb.href === href)) continue;
      crumbs.push({ label, href });
    }

    if (nearest !== normalized) {
      const label = getSegmentAwareLabel(normalized, index);
      if (label && !crumbs.some((crumb) => crumb.href === normalized)) {
        crumbs.push({ label, href: normalized });
      }
    }
  } else {
    const label = getSegmentAwareLabel(normalized, index);
    if (label) {
      crumbs.push({ label, href: normalized });
    }
  }

  return crumbs;
}
