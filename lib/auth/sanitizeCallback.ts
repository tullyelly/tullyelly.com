/**
 * Restrict callback URLs to relative paths or same-origin absolute URLs.
 * Accepts undefined/null for convenience; falls back to "/" when unsafe.
 */
export function sanitizeCallback(
  raw?: string | null,
  currentOrigin?: string,
): string {
  if (!raw) return "/";
  try {
    const base = currentOrigin || "http://localhost";
    const url = new URL(raw, base);
    const isRelative = raw.startsWith("/") || !/^https?:/i.test(raw);
    const isSameOrigin = !!currentOrigin && url.origin === currentOrigin;
    if (isRelative || isSameOrigin) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // ignore parse errors and fall through
  }
  return "/";
}
