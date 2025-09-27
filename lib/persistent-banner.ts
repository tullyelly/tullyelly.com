"use client";

export type PersistentBannerPayload = {
  message: string;
  variant?: "info" | "success" | "warning" | "error";
};

type BannerEventDetail = {
  payload: PersistentBannerPayload | null;
};

export const PERSISTENT_BANNER_STORAGE_KEY = "tullyelly:persistent-banner";
export const PERSISTENT_BANNER_EVENT = "tullyelly:persistent-banner";

function dispatchBannerEvent(payload: PersistentBannerPayload | null): void {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<BannerEventDetail>(PERSISTENT_BANNER_EVENT, {
    detail: { payload },
  });
  window.dispatchEvent(event);
}

export function setPersistentBanner(payload: PersistentBannerPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PERSISTENT_BANNER_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch (err) {
    console.error("Failed to persist banner", err);
  }
  dispatchBannerEvent(payload);
}

export function clearPersistentBanner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PERSISTENT_BANNER_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear banner", err);
  }
  dispatchBannerEvent(null);
}

export function getPersistentBanner(): PersistentBannerPayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PERSISTENT_BANNER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistentBannerPayload;
    if (!parsed?.message) return null;
    return parsed;
  } catch (err) {
    console.error("Failed to parse persisted banner", err);
    return null;
  }
}
