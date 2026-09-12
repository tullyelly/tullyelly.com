"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import ImageLightboxTrigger from "@/components/media/ImageLightboxTrigger";
import type { ImageSlide } from "@/lib/images/image-slide";

type FolderImageCarouselProps = {
  slides: ImageSlide[];
};

export default function FolderImageCarousel({
  slides,
}: FolderImageCarouselProps) {
  if (slides.length === 0) return null;

  const thumbnail = slides[0];

  return (
    <ImageLightboxTrigger slides={slides}>
      <button
        type="button"
        aria-label="Open image carousel"
        data-testid="folder-carousel-thumbnail"
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border-2 border-[var(--cream)] bg-white shadow-sm transition hover:border-[var(--blue)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)]"
      >
        <span className="relative block aspect-[16/9] w-full bg-[var(--ink)]">
          <Image
            src={thumbnail.src}
            alt={thumbnail.alt}
            fill
            sizes="(max-width: 768px) 100vw, 1152px"
            className="object-contain"
          />
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-3 rounded-lg bg-[var(--green)] px-3 py-2 text-sm font-medium text-[var(--cream)] shadow-sm"
        >
          {slides.length} {slides.length === 1 ? "image" : "images"}
        </span>
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--green)] text-[var(--cream)] shadow-sm transition-transform group-hover:scale-105 motion-reduce:transition-none"
        >
          <Maximize2 size={20} />
        </span>
      </button>
    </ImageLightboxTrigger>
  );
}
