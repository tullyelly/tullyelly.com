"use client";

export type PersistentBannerPayload = {
  message: string;
  variant?: "info" | "success" | "warning" | "error";
};

export type PersistentBannerRecord = PersistentBannerPayload & {
  id: string;
  createdAt: number;
};

type BannerEventDetail = {
  banners: PersistentBannerRecord[];
};

export const PERSISTENT_BANNER_STORAGE_KEY = "tullyelly:persistent-banner";
export const PERSISTENT_BANNER_EVENT = "tullyelly:persistent-banner";

let bannerSequence = 0;

function nextBannerId(): string {
  bannerSequence += 1;
  return `persistent-banner-${Date.now().toString(36)}-${bannerSequence.toString(36)}`;
}

function dispatchBannerEvent(banners: PersistentBannerRecord[]): void {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<BannerEventDetail>(PERSISTENT_BANNER_EVENT, {
    detail: { banners },
  });
  window.dispatchEvent(event);
}

function isPayload(value: unknown): value is PersistentBannerPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { message?: unknown }).message === "string" &&
    (value as { message: string }).message.trim().length > 0
  );
}

function normalizeStoredValue(value: unknown): PersistentBannerRecord[] {
  const entries = Array.isArray(value) ? value : [value];
  return entries.flatMap((entry, index) => {
    if (!isPayload(entry)) return [];
    const record = entry as Partial<PersistentBannerRecord>;
    return [
      {
        id:
          typeof record.id === "string" && record.id
            ? record.id
            : `persistent-banner-legacy-${index}`,
        message: record.message!.trim(),
        variant: record.variant,
        createdAt:
          typeof record.createdAt === "number" ? record.createdAt : index,
      },
    ];
  });
}

function storeBanners(
  banners: PersistentBannerRecord[],
  operation: "persist" | "clear" = "persist",
): void {
  if (typeof window === "undefined") return;
  try {
    if (banners.length === 0) {
      window.localStorage.removeItem(PERSISTENT_BANNER_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        PERSISTENT_BANNER_STORAGE_KEY,
        JSON.stringify(banners),
      );
    }
  } catch (err) {
    console.error(
      operation === "clear"
        ? "Failed to clear banner"
        : "Failed to persist banner",
      err,
    );
  }
  dispatchBannerEvent(banners);
}

export function setPersistentBanner(payload: PersistentBannerPayload): string {
  if (typeof window === "undefined") return "";
  const banner: PersistentBannerRecord = {
    ...payload,
    message: payload.message.trim(),
    id: nextBannerId(),
    createdAt: Date.now(),
  };
  storeBanners([...getPersistentBanners(), banner]);
  return banner.id;
}

export function clearPersistentBanner(id?: string): void {
  if (typeof window === "undefined") return;
  if (!id) {
    storeBanners([], "clear");
    return;
  }
  storeBanners(
    getPersistentBanners().filter((banner) => banner.id !== id),
    "clear",
  );
}

export function getPersistentBanners(): PersistentBannerRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PERSISTENT_BANNER_STORAGE_KEY);
  if (!raw) return [];
  try {
    return normalizeStoredValue(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to parse persisted banner", err);
    return [];
  }
}

// Compatibility for existing consumers that only inspect one banner.
export function getPersistentBanner(): PersistentBannerPayload | null {
  return getPersistentBanners()[0] ?? null;
}
