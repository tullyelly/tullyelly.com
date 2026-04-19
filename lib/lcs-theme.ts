import type { CSSProperties } from "react";

export const lcsPageThemeVars: CSSProperties = {
  ["--lcs-surface" as string]: "var(--white)",
  ["--lcs-surface-muted" as string]: "var(--cream)",
  ["--lcs-ink" as string]: "var(--ink)",
  ["--lcs-link" as string]: "var(--blue)",
  ["--lcs-link-hover" as string]: "var(--blue-contrast)",
  ["--lcs-accent" as string]: "var(--blue)",
  ["--lcs-accent-deep" as string]: "var(--blue-contrast)",
  ["--lcs-accent-soft" as string]: "color-mix(in srgb, var(--blue) 12%, white)",
  ["--lcs-accent-wash" as string]: "color-mix(in srgb, var(--blue) 8%, white)",
  ["--lcs-border" as string]: "color-mix(in srgb, var(--blue) 18%, white)",
  ["--lcs-pill-fg" as string]: "var(--white)",
};

export const lcsTableThemeStyle: CSSProperties = {
  ...lcsPageThemeVars,
  ["--table-frame-border" as string]: "var(--lcs-accent)",
  ["--table-head-background" as string]:
    "linear-gradient(135deg,var(--lcs-accent)_0%,var(--lcs-accent-deep)_100%)",
  ["--table-head-text" as string]: "var(--white)",
  ["--table-row-even-bg" as string]: "var(--lcs-accent-wash)",
  ["--table-row-odd-bg" as string]: "var(--lcs-surface)",
  ["--table-row-hover-filter" as string]: "brightness(0.98)",
  ["--table-row-divider" as string]:
    "color-mix(in srgb, var(--lcs-accent) 14%, transparent)",
};
