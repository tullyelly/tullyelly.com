import type { Crumb } from "@/lib/breadcrumb-registry";
import { joinSegments, normalizeUrl, splitPathSegments } from "@/lib/url";

export type MenuNode = {
  id: string;
  label: string;
  href?: string;
  gated?: boolean;
  children?: MenuNode[];
};

export function humanizeBreadcrumbLabel(input: string): string {
  if (!input) return "";
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }
  const normalized = decoded.replace(/[-_]+/g, " ").trim().toLowerCase();
  if (!normalized) return "";
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function findPathByHref(
  root: MenuNode | null | undefined,
  pathname: string,
): MenuNode[] | null {
  if (!root) return null;
  const target = normalizeUrl(pathname);
  const stack: MenuNode[] = [];

  const visit = (node: MenuNode): boolean => {
    stack.push(node);
    if (node.href && normalizeUrl(node.href) === target) {
      return true;
    }
    const children = node.children ?? [];
    for (const child of children) {
      if (visit(child)) {
        return true;
      }
    }
    stack.pop();
    return false;
  };

  return visit(root) ? [...stack] : null;
}

function fallbackFromSegments(pathname: string): Crumb[] {
  const normalized = normalizeUrl(pathname);
  if (normalized === "/") {
    return [{ label: "home" }];
  }
  const segments = splitPathSegments(normalized);
  const crumbs: Crumb[] = [{ label: "home", href: "/" }];
  const pathParts: string[] = [];

  segments.forEach((segment, index) => {
    pathParts.push(segment);
    const label = humanizeBreadcrumbLabel(segment);
    const href = joinSegments(pathParts);
    crumbs.push({
      label: label || segment,
      href: index === segments.length - 1 ? undefined : href,
    });
  });

  if (crumbs.length) {
    delete crumbs[crumbs.length - 1]?.href;
  }

  return crumbs;
}

export function deriveCrumbsFromPath(
  menuRoot: MenuNode | null | undefined,
  pathname: string,
): Crumb[] {
  const pathNodes = findPathByHref(menuRoot ?? null, pathname);

  if (!pathNodes || pathNodes.length === 0) {
    return fallbackFromSegments(pathname);
  }

  const filteredNodes = pathNodes.filter(
    (node) => !node.gated && node.label && node.label.trim().length,
  );

  const crumbs: Crumb[] = filteredNodes.map((node) => ({
    label: node.label,
    href: node.href,
  }));

  if (!crumbs.length) {
    return fallbackFromSegments(pathname);
  }

  // Ensure the last crumb is treated as current page.
  delete crumbs[crumbs.length - 1]?.href;

  const first = crumbs[0];
  if (!first || normalizeUrl(first.href ?? first.label) !== "/") {
    crumbs.unshift({ label: "home", href: "/" });
  }

  // Collapse duplicates while preserving order.
  const seen = new Set<string>();
  return crumbs.filter((crumb) => {
    const key = `${crumb.label}|${crumb.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeForcedCrumbs(
  forcedItems: Crumb[] | undefined,
  fallbackItems: Crumb[],
): Crumb[] {
  if (forcedItems && forcedItems.length) {
    const normalized = forcedItems.map((crumb, index) => ({
      ...crumb,
      href: index === forcedItems.length - 1 ? undefined : crumb.href,
    }));
    return normalized;
  }
  return fallbackItems;
}
