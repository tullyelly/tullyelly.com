export const RECENT_STORAGE_KEY = "te_cmdk_recent_v1";
export const RECENT_LIMIT = 8;
export const RECENTS_UPDATED_EVENT = "menu:recents-updated";

export type RecentItem = {
  href: string;
  title: string;
  category?: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function resolveStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeRecentHref(value: unknown): string | null {
  const href = cleanText(value);
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  const pathname = href.split(/[?#]/, 1)[0] || "/";
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function titleFromHref(href: string): string {
  if (href === "/") return "Home";
  const segment = href.split("/").filter(Boolean).at(-1) ?? "Page";
  try {
    return decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return segment.replace(/[-_]+/g, " ");
  }
}

function sanitizeItem(value: unknown): RecentItem | null {
  if (typeof value === "string") {
    const href = normalizeRecentHref(value);
    return href ? { href, title: titleFromHref(href) } : null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const href = normalizeRecentHref(record.href);
  if (!href) return null;
  const category = cleanText(record.category);
  return {
    href,
    title: cleanText(record.title) ?? titleFromHref(href),
    ...(category ? { category } : {}),
  };
}

function sanitizeList(value: unknown): RecentItem[] {
  if (!Array.isArray(value)) return [];
  const items: RecentItem[] = [];
  const seen = new Set<string>();
  for (const valueItem of value) {
    const item = sanitizeItem(valueItem);
    if (!item || seen.has(item.href)) continue;
    seen.add(item.href);
    items.push(item);
    if (items.length === RECENT_LIMIT) break;
  }
  return items;
}

export function readRecent(): RecentItem[] {
  const storage = resolveStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveRecent(list: RecentItem[]): void {
  const storage = resolveStorage();
  if (!storage) return;
  try {
    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(sanitizeList(list)));
    window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));
  } catch {
    // Ignore persistence errors; best-effort only.
  }
}

export function upsertRecent(
  existing: RecentItem[],
  item: RecentItem,
): RecentItem[] {
  const normalized = sanitizeItem(item);
  if (!normalized) return sanitizeList(existing);
  return [
    normalized,
    ...sanitizeList(existing).filter((entry) => entry.href !== normalized.href),
  ].slice(0, RECENT_LIMIT);
}

const EXCLUDED_PATHS = new Set(["/forbidden", "/login", "/menu-test"]);

export function isRecentRouteEligible(href: string): boolean {
  const pathname = normalizeRecentHref(href);
  if (!pathname || EXCLUDED_PATHS.has(pathname)) return false;
  return !["/api/", "/_next/", "/_sanity/"].some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function titleForRecentDocument(documentTitle: string): string | null {
  const title = documentTitle.split(";")[0]?.trim();
  if (!title || /^(access denied|page not found|not found)$/i.test(title)) {
    return null;
  }
  return title;
}

export function recordRecentVisit(item: RecentItem): RecentItem[] {
  if (!isRecentRouteEligible(item.href)) return readRecent();
  const next = upsertRecent(readRecent(), item);
  saveRecent(next);
  return next;
}
