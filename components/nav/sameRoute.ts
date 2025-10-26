import type { MouseEvent } from "react";

type NormalizedRoute = {
  pathname: string;
  search: string;
};

const FALLBACK_ORIGIN = "http://route-normalize";

function toUrl(input: string): URL | null {
  try {
    if (!input) {
      return new URL("/", FALLBACK_ORIGIN);
    }
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return new URL(input);
    }
    return input.startsWith("/")
      ? new URL(input, FALLBACK_ORIGIN)
      : new URL(`/${input}`, FALLBACK_ORIGIN);
  } catch {
    return null;
  }
}

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const ensured = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const trimmed =
    ensured.endsWith("/") && ensured !== "/"
      ? ensured.replace(/\/+$/, "")
      : ensured;
  return trimmed || "/";
}

function normalizeSearch(search: string): string {
  if (!search) return "";
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return "";

  const params = new URLSearchParams(raw);
  const entries = Array.from(params.entries());
  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1].localeCompare(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  const normalized = new URLSearchParams();
  for (const [key, value] of entries) {
    normalized.append(key, value);
  }
  const result = normalized.toString();
  return result ? `?${result}` : "";
}

function manualNormalize(input: string): NormalizedRoute {
  const trimmed = input.trim();
  if (!trimmed) {
    return { pathname: "/", search: "" };
  }
  const hashIndex = trimmed.indexOf("#");
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const searchIndex = withoutHash.indexOf("?");

  const pathname =
    searchIndex >= 0 ? withoutHash.slice(0, searchIndex) : withoutHash;
  const search = searchIndex >= 0 ? withoutHash.slice(searchIndex) : "";

  return {
    pathname: normalizePathname(pathname),
    search: normalizeSearch(search),
  };
}

function normalizeRoute(input: string): NormalizedRoute {
  const url = toUrl(input);
  if (url) {
    return {
      pathname: normalizePathname(url.pathname),
      search: normalizeSearch(url.search),
    };
  }
  return manualNormalize(input);
}

export function isSameRoute(currentPath: string, href: string): boolean {
  const current = normalizeRoute(currentPath);
  const target = normalizeRoute(href);
  return (
    current.pathname === target.pathname && current.search === target.search
  );
}

export function handleSameRouteNoop(
  event: MouseEvent,
  closeUI: () => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  const nativeEvent = event.nativeEvent as {
    stopImmediatePropagation?: () => void;
  };
  nativeEvent.stopImmediatePropagation?.();
  try {
    closeUI();
  } catch {
    // ignore close errors
  }
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    // ignore scroll errors
  }
}
