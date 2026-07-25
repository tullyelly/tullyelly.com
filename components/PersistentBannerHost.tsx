"use client";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as Dialog from "@ui/dialog";
import { cn } from "@/lib/utils";
import {
  clearPersistentBanner,
  getPersistentBanners,
  PERSISTENT_BANNER_EVENT,
  PERSISTENT_BANNER_STORAGE_KEY,
  type PersistentBannerRecord,
} from "@/lib/persistent-banner";

const variantPresentation = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    className:
      "border-green-950 bg-green-700 text-white shadow-[0_8px_24px_rgba(21,128,61,0.35)]",
    buttonClassName:
      "border-white/70 bg-white text-green-950 hover:bg-green-50",
  },
  error: {
    label: "Failure",
    icon: CircleAlert,
    className:
      "border-red-950 bg-red-700 text-white shadow-[0_8px_24px_rgba(185,28,28,0.35)]",
    buttonClassName: "border-white/70 bg-white text-red-950 hover:bg-red-50",
  },
  warning: {
    label: "Heads up",
    icon: TriangleAlert,
    className:
      "border-amber-800 bg-amber-300 text-amber-950 shadow-[0_8px_24px_rgba(217,119,6,0.3)]",
    buttonClassName:
      "border-amber-950/60 bg-amber-950 text-white hover:bg-amber-900",
  },
  info: {
    label: "Notice",
    icon: Info,
    className:
      "border-blue-950 bg-blue-700 text-white shadow-[0_8px_24px_rgba(29,78,216,0.3)]",
    buttonClassName: "border-white/70 bg-white text-blue-950 hover:bg-blue-50",
  },
} as const;

function PersistentNotification({
  banner,
}: {
  banner: PersistentBannerRecord;
}) {
  const presentation = variantPresentation[banner.variant ?? "warning"];
  const Icon = presentation.icon;
  const role =
    banner.variant === "error" || banner.variant === "warning"
      ? "alert"
      : "status";

  return (
    <li
      role={role}
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border-2 p-4",
        presentation.className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="!m-0 text-xs font-black uppercase tracking-[0.12em]">
            {presentation.label}
          </p>
          <p className="!m-0 mt-1 text-base font-bold leading-snug">
            {banner.message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => clearPersistentBanner(banner.id)}
        aria-label={`Dismiss announcement: ${banner.message}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-black shadow-sm transition",
          presentation.buttonClassName,
        )}
      >
        Dismiss
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function PersistentBannerHost() {
  const [banners, setBanners] = useState<PersistentBannerRecord[]>([]);

  useEffect(() => {
    const readFromStorage = () => setBanners(getPersistentBanners());
    readFromStorage();

    const handleCustomEvent = (event: Event) => {
      const detail = (
        event as CustomEvent<{ banners: PersistentBannerRecord[] }>
      ).detail;
      setBanners(detail?.banners ?? []);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PERSISTENT_BANNER_STORAGE_KEY) readFromStorage();
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

  if (banners.length === 0) return null;

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          draggable={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="!z-[90] max-h-[min(80vh,44rem)] gap-5 rounded-2xl border-2 border-ink bg-white p-5 shadow-2xl md:p-6"
        >
          <div>
            <Dialog.Title className="text-2xl font-black text-ink">
              Notifications
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm font-medium text-ink/70">
              Review each message and dismiss it when you are finished.
            </Dialog.Description>
          </div>
          <ul
            aria-label="Page notifications"
            className="space-y-3 overflow-y-auto"
          >
            {banners.map((banner) => (
              <PersistentNotification key={banner.id} banner={banner} />
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
