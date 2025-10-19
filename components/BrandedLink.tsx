"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type BrandedLinkProps = ComponentProps<typeof Link>;

// simple class combiner
function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function BrandedLink({
  className,
  style,
  ...props
}: BrandedLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        // force white across states to avoid default blue links
        "text-white visited:text-white hover:text-white focus:text-white",
        // underline behavior + readability
        "no-underline hover:underline underline-offset-4",
        // weight + tracking to match header
        "font-semibold tracking-tight",
        // accessible focus ring that works on brand chrome
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-chrome)]",
        className,
      )}
      // keep using your CSS var for foreground color (white on blue)
      style={{ color: "var(--brand-chrome-fg)", ...(style ?? {}) }}
    />
  );
}
