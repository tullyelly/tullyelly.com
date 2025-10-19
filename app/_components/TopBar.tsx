"use client";

import { memo } from "react";

type TopBarProps = {
  active: boolean;
  progress: number;
  color?: string;
  glow?: string;
  height?: number;
  reducedMotion?: boolean;
  zIndex?: number;
};

function TopBarImpl({
  active,
  progress,
  color = "#00471B",
  glow = "#F0EBD2",
  height = 3,
  reducedMotion = false,
  zIndex = 9999,
}: TopBarProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height,
        width: "100%",
        zIndex,
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: reducedMotion
          ? "opacity 0.15s linear"
          : "opacity 0.25s ease",
      }}
    >
      <div
        style={{
          transform: `scaleX(${Math.max(0.02, Math.min(1, progress))})`,
          transformOrigin: "0% 50%",
          height: "100%",
          width: "100%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${glow}, 0 0 2px ${glow}`,
          transition: reducedMotion ? undefined : "transform 0.2s ease-out",
        }}
      />
    </div>
  );
}

export const TopBar = memo(TopBarImpl);
