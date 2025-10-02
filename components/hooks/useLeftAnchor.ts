"use client";

import * as React from "react";

type Opts = {
  anchorSelector?: string;
  margin?: number;
};

export function useLeftAnchor(opts: Opts = {}) {
  const { anchorSelector = "#page-main", margin = 16 } = opts;
  const [left, setLeft] = React.useState<number>(margin);
  const panelRef = React.useRef<HTMLElement | null>(null);

  const compute = React.useCallback(
    (panel?: HTMLElement | null) => {
      if (panel) panelRef.current = panel;
      const target = panel ?? panelRef.current;

      const vw = window.innerWidth || 0;
      const anchor = document.querySelector(
        anchorSelector,
      ) as HTMLElement | null;

      let targetLeft = margin;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const padL =
          parseFloat(getComputedStyle(anchor).paddingLeft || "0") || 0;
        targetLeft = Math.round(rect.left + padL);
      }

      const width = target?.getBoundingClientRect().width ?? 0;
      const clamped = Math.max(
        margin,
        Math.min(targetLeft, vw - width - margin),
      );
      setLeft(clamped);
    },
    [anchorSelector, margin],
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

  return { left, compute };
}
