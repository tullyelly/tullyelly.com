"use client";

import Image from "next/image";
import { useEffect } from "react";

interface HeroProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  priority?: boolean;
}

export default function Hero({
  src,
  alt,
  width,
  height,
  caption,
  priority = true,
}: HeroProps) {
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
  useEffect(() => {
    document.body.classList.add("has-hero");
    return () => {
      document.body.classList.remove("has-hero");
    };
  }, []);
  return (
    <figure>
      <Image
        src={normalizedSrc}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, 1200px"
        priority={priority}
      />
      {caption && <figcaption className="muted">{caption}</figcaption>}
    </figure>
  );
}
