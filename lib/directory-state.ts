/** Public browse state only. Edit drafts and capabilities never belong in URLs. */
export const DIRECTORY_QUERY_KEYS = [
  "q",
  "sort",
  "page",
  "pageSize",
  "sport",
  "trend",
  "category",
  "state",
  "status",
  "alterEgo",
] as const;

export function readDirectoryValue<T extends string | number>(
  params: URLSearchParams,
  key: string,
  fallback: T,
  allowed?: readonly T[],
): T {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const value =
    typeof fallback === "number"
      ? /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(Number(raw))
        ? Number(raw)
        : fallback
      : raw;
  return (allowed && !allowed.includes(value as T) ? fallback : value) as T;
}

export function updateDirectoryQuery(
  search: string,
  key: string,
  value: string | number,
  fallback: string | number,
): string {
  const params = new URLSearchParams(search);
  if (value === fallback || value === "") params.delete(key);
  else params.set(key, String(value));
  if (key !== "page") params.delete("page");
  return params.toString();
}

export function clampDirectoryPage(
  page: number,
  total: number,
  pageSize: number,
) {
  return Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / pageSize)));
}

/** Accept only the expected directory; never turn a back link into a redirect. */
export function safeDirectoryReturn(
  candidate: string | null | undefined,
  directory: string,
  keys: readonly string[] = DIRECTORY_QUERY_KEYS,
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(candidate)
  )
    return directory;
  try {
    decodeURIComponent(candidate);
    const url = new URL(candidate, "https://directory.invalid");
    if (
      url.origin !== "https://directory.invalid" ||
      url.pathname !== directory ||
      url.username ||
      url.password ||
      url.hash
    )
      return directory;
    const params = new URLSearchParams();
    for (const key of keys) {
      const value = url.searchParams.get(key);
      if (value !== null) params.set(key, value);
    }
    const query = params.toString();
    return directory + (query ? `?${query}` : "");
  } catch {
    return directory;
  }
}

export function withDirectoryReturn(href: string, directory: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://directory.invalid");
  url.searchParams.set("returnTo", directory);
  return `${url.pathname}${url.search}${url.hash}`;
}
