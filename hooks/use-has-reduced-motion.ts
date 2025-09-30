"use client";

import * as React from "react";

export function useHasReducedMotion(defaultValue = false): boolean {
  const isServer = typeof window === "undefined";
  const [prefersReduced, setPrefersReduced] = React.useState(defaultValue);

  React.useEffect(() => {
    if (isServer || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [isServer]);

  return prefersReduced;
}
