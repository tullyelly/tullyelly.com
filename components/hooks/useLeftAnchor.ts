"use client";

import * as React from "react";

type Opts = {
  anchorSelector?: string;
  margin?: number;
  widthPadding?: number;
  fallbackWidth?: number;
};

type Metrics = {
  left: number;
  width: number;
};

export function useLeftAnchor(opts: Opts = {}) {
  const {
    anchorSelector = "#page-main",
    margin = 16,
    widthPadding = 0,
    fallbackWidth = 640,
  } = opts;
  const [{ left, width }, setMetrics] = React.useState<Metrics>({
    left: margin,
    width: Math.max(fallbackWidth, 0),
  });
  const panelRef = React.useRef<HTMLElement | null>(null);

  const compute = React.useCallback(
    (panel?: HTMLElement | null) => {
      if (panel) panelRef.current = panel;
      const target = panel ?? panelRef.current;

      const vw = window.innerWidth || 0;
      const anchor = document.querySelector(
        anchorSelector,
      ) as HTMLElement | null;

      let resolvedLeft = margin;
      let resolvedWidth = fallbackWidth;

      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        resolvedLeft = Math.round(rect.left);
        resolvedWidth = Math.round(rect.width);
      } else if (target) {
        const rect = target.getBoundingClientRect();
        resolvedWidth = Math.round(rect.width);
      } else {
        resolvedWidth = Math.max(fallbackWidth, vw - margin * 2);
      }

      if (!Number.isFinite(resolvedWidth) || resolvedWidth <= 0) {
        resolvedWidth = Math.max(fallbackWidth, vw - margin * 2);
      }

      resolvedWidth += widthPadding;

      const viewportAllowance = Math.max(vw - margin * 2, 0);
      const clampedWidth = Math.min(resolvedWidth, viewportAllowance);
      const maxLeft = Math.max(vw - clampedWidth - margin, margin);
      const clampedLeft = Math.min(Math.max(resolvedLeft, margin), maxLeft);

      setMetrics({ left: clampedLeft, width: clampedWidth });
    },
    [anchorSelector, fallbackWidth, margin, widthPadding],
  );

  React.useLayoutEffect(() => {
    compute();
    const onUpdate = () => compute();
    window.addEventListener("resize", onUpdate, { passive: true });
    window.addEventListener("scroll", onUpdate, { passive: true });
    return () => {
      window.removeEventListener("resize", onUpdate);
      window.removeEventListener("scroll", onUpdate);
    };
  }, [compute]);

  return { left, width, compute };
}
