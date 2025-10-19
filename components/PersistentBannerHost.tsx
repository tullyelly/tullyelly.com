"use client";

import { useEffect, useState } from "react";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import {
  clearPersistentBanner,
  getPersistentBanner,
  PERSISTENT_BANNER_EVENT,
  PERSISTENT_BANNER_STORAGE_KEY,
  type PersistentBannerPayload,
} from "@/lib/persistent-banner";

export default function PersistentBannerHost() {
  const [banner, setBanner] = useState<PersistentBannerPayload | null>(null);

  useEffect(() => {
    const readFromStorage = () => {
      setBanner(getPersistentBanner());
    };

    readFromStorage();

    const handleCustomEvent = (event: Event) => {
      const detail = (
        event as CustomEvent<{ payload: PersistentBannerPayload | null }>
      ).detail;
      setBanner(detail?.payload ?? null);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PERSISTENT_BANNER_STORAGE_KEY) {
        readFromStorage();
      }
    };

    window.addEventListener(
      PERSISTENT_BANNER_EVENT,
      handleCustomEvent as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        PERSISTENT_BANNER_EVENT,
        handleCustomEvent as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (!banner) return null;

  return (
    <AnnouncementBanner
      message={banner.message}
      variant={banner.variant ?? "warning"}
      dismissible
      onDismiss={clearPersistentBanner}
      className="text-sm"
    />
  );
}
