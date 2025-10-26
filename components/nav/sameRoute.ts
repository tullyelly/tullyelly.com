import type { MouseEvent } from "react";

function normalizePath(p: string): string {
  try {
    const u = p.startsWith("/")
      ? new URL(p, "http://x")
      : new URL("/" + p, "http://x");
    const path =
      u.pathname.endsWith("/") && u.pathname !== "/"
        ? u.pathname.slice(0, -1)
        : u.pathname;
    return path;
  } catch {
    if (p === "/") return "/";
    return p.replace(/\/+$/, "");
  }
}

export function isSameRoute(currentPath: string, href: string): boolean {
  return normalizePath(currentPath) === normalizePath(href);
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
