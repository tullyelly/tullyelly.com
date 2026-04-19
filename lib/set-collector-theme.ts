import type { CSSProperties } from "react";

const setCollectorThemeVars: CSSProperties = {
  ["--collector-accent" as string]: "#B85A34",
  ["--collector-accent-deep" as string]: "#984224",
  ["--collector-accent-soft" as string]: "#F5E7DE",
  ["--collector-accent-wash" as string]: "#FBF5F1",
  ["--collector-link" as string]: "var(--blue)",
  ["--collector-link-hover" as string]: "#28467F",
  ["--collector-pill-fg" as string]: "#FAF7F2",
  ["--collector-ink" as string]: "#343840",
  ["--collector-border" as string]: "#D9C9C0",
  ["--collector-surface" as string]: "#FFFCFA",
};

export const setCollectorPageThemeVars = setCollectorThemeVars;

export const setCollectorTableThemeStyle: CSSProperties = {
  ...setCollectorThemeVars,
  ["--table-frame-border" as string]: "var(--collector-accent)",
  ["--table-head-background" as string]:
    "linear-gradient(135deg, var(--collector-accent) 0%, var(--collector-accent-deep) 100%)",
  ["--table-head-text" as string]: "var(--collector-pill-fg)",
  ["--table-row-even-bg" as string]: "var(--collector-accent-wash)",
  ["--table-row-odd-bg" as string]: "var(--collector-surface)",
  ["--table-row-hover-filter" as string]: "brightness(0.98)",
  ["--table-row-divider" as string]:
    "color-mix(in srgb, var(--collector-accent) 14%, transparent)",
};
