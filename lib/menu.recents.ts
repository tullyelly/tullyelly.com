export const RECENT_STORAGE_KEY = "te_cmdk_recent_v1";
export const RECENT_LIMIT = 8;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function resolveStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const entries = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length);
  return Array.from(new Set(entries)).slice(0, RECENT_LIMIT);
}

export function readRecent(): string[] {
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

export function saveRecent(list: string[]): void {
  const storage = resolveStorage();
  if (!storage) return;
  try {
    storage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify(list.slice(0, RECENT_LIMIT)),
    );
  } catch {
    // Ignore persistence errors; best-effort only.
  }
}

export function upsertRecent(existing: string[], href: string): string[] {
  const normalized = typeof href === "string" ? href.trim() : "";
  if (!normalized) return existing.slice(0, RECENT_LIMIT);
  const filtered = existing.filter((entry) => entry !== normalized);
  filtered.unshift(normalized);
  return filtered.slice(0, RECENT_LIMIT);
}
