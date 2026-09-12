"use client";

import type { ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import ImageLightboxTrigger from "@/components/media/ImageLightboxTrigger";
import type { ImageSlide } from "@/lib/images/image-slide";

type InteractiveImageProps = {
  slide: ImageSlide;
  children: ReactNode;
};

export default function InteractiveImage({
  slide,
  children,
}: InteractiveImageProps) {
  return (
    <ImageLightboxTrigger slides={[slide]}>
      <button
        type="button"
        aria-label={slide.alt ? `Open image: ${slide.alt}` : "Open image"}
        data-testid="interactive-image-trigger"
        className="group relative block w-full cursor-zoom-in rounded-xl text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)]"
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--green)] text-[var(--cream)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          <Maximize2 size={18} />
        </span>
      </button>
    </ImageLightboxTrigger>
  );
}
