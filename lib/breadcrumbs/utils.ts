import type { Crumb, CrumbKind } from "@/lib/breadcrumbs/types";

const LANDING_PATH_REDIRECTS = new Map<string, string>([
  ["/mark2/blueprint", "/mark2"],
]);

function stripQueryAndHash(pathname: string): string {
  const [clean] = pathname.split(/[?#]/, 1);
  return clean;
}

function sanitizePath(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = stripQueryAndHash(pathname.trim());
  if (!trimmed) return "/";
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = prefixed.replace(/\/{2,}/g, "/");
  if (normalized === "/") {
    return "/";
  }
  return normalized.replace(/\/+$/, "") || "/";
}

export function normalizePathForCrumbs(pathname: string): string {
  const sanitized = sanitizePath(pathname || "/");
  const redirect = LANDING_PATH_REDIRECTS.get(sanitized);
  if (redirect) {
    return redirect;
  }
  return sanitized;
}

function isHomeCrumb(crumb: Crumb | undefined): boolean {
  if (!crumb) return false;
  if (crumb.href && crumb.href !== "/") return false;
  const label = crumb.label?.trim().toLowerCase();
  return !label || label === "home";
}

export function ensureSingleHome(crumbs: readonly Crumb[]): Crumb[] {
  const next: Crumb[] = [];
  let hasHome = false;

  for (const crumb of crumbs) {
    if (isHomeCrumb(crumb)) {
      if (hasHome) {
        continue;
      }
      next.push({ label: "Home", href: "/", kind: crumb.kind ?? "root" });
      hasHome = true;
    } else {
      const existingIndex = next.findIndex(
        (candidate) =>
          candidate.href === crumb.href && candidate.label === crumb.label,
      );
      if (existingIndex >= 0) continue;
      next.push({ ...crumb });
    }
  }

  if (!hasHome) {
    next.unshift({ label: "Home", href: "/", kind: "root" });
  } else if (next[0]?.href !== "/") {
    next.unshift({ label: "Home", href: "/", kind: "root" });
  }

  return next;
}

export function applyCrumbKinds(crumbs: readonly Crumb[]): Crumb[] {
  return crumbs.map((crumb, index, array) => {
    if (crumb.kind) return { ...crumb };
    let kind: CrumbKind = "segment";
    if (index === 0) {
      kind = "root";
    } else if (index === array.length - 1) {
      kind = "leaf";
    }
    const href = crumb.href ?? undefined;
    return { ...crumb, kind, href };
  });
}

export function humanizePathSegment(segment: string): string {
  if (!segment) return "";
  const decoded = (() => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  })();
  return decoded.replace(/[-_]+/g, " ").trim();
}

export function buildFallbackCrumbs(pathname: string): Crumb[] {
  const normalized = normalizePathForCrumbs(pathname);
  if (normalized === "/") {
    return [{ label: "Home", href: "/" }];
  }
  const segments = normalized.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let current = "";
  segments.forEach((segment, index) => {
    current += `/${segment}`;
    const label = humanizePathSegment(segment);
    crumbs.push({
      label: label || segment,
      href: index === segments.length - 1 ? undefined : current,
    });
  });
  return ensureSingleHome(crumbs);
}
