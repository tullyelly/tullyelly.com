"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import * as Dialog from "@ui/dialog";
import { X } from "lucide-react";
import Lightbox, { type Plugin } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { ImageSlide } from "@/lib/images/image-slide";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import styles from "./image-viewer.module.css";

// Inline removes YARL's portal and scroll lock. Radix owns dialog semantics,
// focus containment, Escape, scroll locking, and restoration to the trigger.
// Override Inline's pan-y default so the Zoom plugin owns touch gestures.
const RadixDialog: Plugin = ({ augment }) => {
  augment(({ controller, ...props }) => ({
    ...props,
    controller: {
      ...controller,
      aria: false,
      focus: false,
      touchAction: "none",
      closeOnEscape: false,
    },
  }));
};

const counterContainerProps = {
  "data-testid": "image-lightbox-counter",
} as HTMLAttributes<HTMLDivElement>;

type ImageLightboxProps = {
  slides: ImageSlide[];
  index: number;
};

export default function ImageLightbox({ slides, index }: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [currentIndex, setCurrentIndex] = useState(index);
  const multiple = slides.length > 1;

  // The viewer is lazy-loaded; move focus from the loading state into its
  // controls once ready. Subsequent slide changes must not move focus.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <>
      <Lightbox
        className={styles.viewer}
        slides={slides}
        index={index}
        plugins={[
          Inline,
          Zoom,
          Fullscreen,
          ...(multiple ? [Counter] : []),
          RadixDialog,
        ]}
        carousel={{ finite: true, preload: 1, imageFit: "contain" }}
        zoom={{ scrollToZoom: true, maxZoomPixelRatio: 3 }}
        controller={{ preventDefaultWheelX: true, preventDefaultWheelY: true }}
        toolbar={{
          buttons: [
            "zoom",
            "fullscreen",
            <Dialog.Close
              key="close"
              ref={closeRef}
              aria-label="Close image viewer"
              className="yarl__button"
            >
              <X aria-hidden="true" className="yarl__icon" />
            </Dialog.Close>,
          ],
        }}
        render={
          multiple
            ? undefined
            : { buttonPrev: () => null, buttonNext: () => null }
        }
        counter={{ container: counterContainerProps }}
        on={{ view: ({ index: nextIndex }) => setCurrentIndex(nextIndex) }}
      />
      {multiple && (
        <span className="sr-only" role="status" aria-live="polite">
          Image {currentIndex + 1} of {slides.length}
        </span>
      )}
    </>
  );
}
