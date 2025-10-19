"use client";

import * as React from "react";

export function useTopAnchor(
  headerId = "site-header",
  gapVar = "--cmdk-gap",
  fallbackH = 64,
  fallbackGap = 8,
) {
  const [top, setTop] = React.useState<number>(fallbackH + fallbackGap);

  const compute = React.useCallback(() => {
    const root = document.documentElement;
    const gap =
      parseFloat(getComputedStyle(root).getPropertyValue(gapVar)) ||
      fallbackGap;
    const header = document.getElementById(headerId);
    const h = header?.getBoundingClientRect().height ?? fallbackH;
    setTop(Math.round(h + gap));
  }, [headerId, gapVar, fallbackH, fallbackGap]);

  React.useLayoutEffect(() => {
    compute();
    const header = document.getElementById(headerId);
    const ro = header ? new ResizeObserver(compute) : undefined;
    ro?.observe(header as Element);
    window.addEventListener("resize", compute, { passive: true });
    window.addEventListener("scroll", compute, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
    };
  }, [compute, headerId]);

  return top;
}
