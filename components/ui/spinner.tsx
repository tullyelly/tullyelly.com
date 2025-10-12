"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} satisfies Record<"sm" | "md" | "lg", string>;

export type SpinnerSize = keyof typeof SIZE_CLASSES;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({
  size = "md",
  label = "Loading...",
  className,
  ...props
}: SpinnerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const sizeClass = SIZE_CLASSES[size as SpinnerSize] ?? SIZE_CLASSES.md;

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center justify-center text-green motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-in-out",
        className,
      )}
      {...props}
    >
      <Loader2
        aria-hidden="true"
        className={cn(
          "text-current motion-safe:animate-spin motion-reduce:animate-none",
          sizeClass,
          prefersReducedMotion && "hidden",
        )}
      />
      <span className="sr-only">{label}</span>
      {prefersReducedMotion ? (
        <span aria-hidden="true" className="text-sm font-medium text-current">
          {label}
        </span>
      ) : null}
    </span>
  );
}
