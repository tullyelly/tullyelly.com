"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import Modal, {
  ModalClose,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

type Slide = {
  src: string;
  alt: string;
};

type FolderImageCarouselProps = {
  slides: Slide[];
};

export default function FolderImageCarousel({
  slides,
}: FolderImageCarouselProps) {
  const [open, setOpen] = React.useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    updateScrollState();
    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);
    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  React.useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(0);
    }
  }, [open, emblaApi]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi?.scrollPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi?.scrollNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, emblaApi]);

  if (slides.length === 0) {
    return null;
  }

  const totalSlides = slides.length;
  const currentSlide = Math.min(selectedIndex + 1, totalSlides);
  const thumbnail = slides[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open image carousel"
        data-testid="folder-carousel-thumbnail"
        className="group relative w-full overflow-hidden rounded-2xl border-2 border-[var(--cream)] bg-white shadow-sm transition hover:border-[var(--blue)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)]"
      >
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={thumbnail.src}
            alt={thumbnail.alt}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <span
          aria-hidden="true"
          data-testid="folder-carousel-play-overlay"
          className="absolute inset-0 flex items-center justify-center bg-ink/30"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg ring-2 ring-[var(--blue)] transition-transform duration-300 group-hover:scale-105">
            <Play className="h-6 w-6" />
          </span>
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-[min(92vw,960px)] max-w-[960px] sm:w-[min(92vw,960px)] overflow-hidden"
      >
        <div
          className="flex min-h-0 w-full flex-1 flex-col"
          data-testid="folder-carousel-modal"
        >
          <div
            data-dialog-handle
            className="flex items-center justify-between gap-3 rounded-t-2xl bg-[var(--blue)] px-5 py-3 text-white"
          >
            <ModalTitle className="text-sm font-semibold">
              Image carousel
            </ModalTitle>
            <ModalClose asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--blue)]"
                aria-label="Close carousel"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <X className="h-4 w-4" />
              </button>
            </ModalClose>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
            <ModalDescription className="sr-only">
              Image carousel with {totalSlides} slides.
            </ModalDescription>
            <div className="relative min-h-0 flex-1">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {slides.map((slide) => (
                    <div key={slide.src} className="min-w-0 flex-[0_0_100%]">
                      <div className="relative h-[60vh] min-h-[280px] w-full">
                        <Image
                          src={slide.src}
                          alt={slide.alt}
                          fill
                          sizes="(max-width: 768px) 90vw, 900px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="mt-3 grid w-full grid-cols-[auto_1fr_auto] items-center gap-3"
              data-testid="carousel-nav"
            >
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label="Previous image"
                data-testid="carousel-prev"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span
                className="text-center text-sm font-medium text-ink/70 tabular-nums"
                data-testid="carousel-counter"
                aria-live="polite"
              >
                {currentSlide} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label="Next image"
                data-testid="carousel-next"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
