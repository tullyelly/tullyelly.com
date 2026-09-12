"use client";

import { lazy, Suspense, useState, type ReactElement } from "react";
import * as Dialog from "@ui/dialog";
import { X } from "lucide-react";
import type { ImageSlide } from "@/lib/images/image-slide";
import styles from "./image-viewer.module.css";

const ImageLightbox = lazy(() => import("./ImageLightbox"));

type ImageLightboxTriggerProps = {
  slides: ImageSlide[];
  initialIndex?: number;
  children: ReactElement;
};

export default function ImageLightboxTrigger({
  slides,
  initialIndex = 0,
  children,
}: ImageLightboxTriggerProps) {
  const [open, setOpen] = useState(false);

  if (!slides.length) return null;

  const index = Math.max(0, Math.min(initialIndex, slides.length - 1));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      {open && (
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.PrimitiveContent aria-modal="true" className={styles.dialog}>
            <Dialog.Title className="sr-only">Image viewer</Dialog.Title>
            <Dialog.Description className="sr-only">
              Zoom with the zoom controls, a pinch, or a double tap. Drag to pan
              a zoomed image.
              {slides.length > 1 &&
                " Use the arrow keys or swipe to browse images when zoomed out."}
              {" Press Escape to close."}
            </Dialog.Description>
            <Suspense
              fallback={
                <div className={styles.loading}>
                  <p role="status">Loading image viewer…</p>
                  <Dialog.Close
                    aria-label="Close image viewer"
                    className={styles.loadingClose}
                  >
                    <X aria-hidden="true" size={24} />
                  </Dialog.Close>
                </div>
              }
            >
              <ImageLightbox slides={slides} index={index} />
            </Suspense>
          </Dialog.PrimitiveContent>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
