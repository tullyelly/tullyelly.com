export function normalizeUrl(input: string | URL | null | undefined): string {
  if (!input) return "/";
  const raw = typeof input === "string" ? input : input.pathname;
  if (!raw) return "/";
  const [pathname] = raw.split(/[?#]/, 1);
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const collapsed = withLeading.replace(/\/{2,}/g, "/");
  const trimmed = collapsed.replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
}

export function splitPathSegments(pathname: string): string[] {
  const normalized = normalizeUrl(pathname);
  if (normalized === "/") return [];
  return normalized.split("/").filter(Boolean);
}

export function joinSegments(segments: Iterable<string>): string {
  const parts = Array.from(segments).filter(Boolean);
  if (!parts.length) return "/";
  return normalizeUrl(`/${parts.join("/")}`);
}
