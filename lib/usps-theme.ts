import type { CSSProperties } from "react";

export const uspsPageThemeVars: CSSProperties = {
  ["--usps-surface" as string]: "var(--white)",
  ["--usps-surface-muted" as string]: "var(--cream)",
  ["--usps-ink" as string]: "var(--ink)",
  ["--usps-link" as string]: "var(--blue)",
  ["--usps-link-hover" as string]: "var(--blue-contrast)",
  ["--usps-accent" as string]: "var(--blue)",
  ["--usps-accent-deep" as string]: "var(--blue-contrast)",
  ["--usps-accent-soft" as string]: "color-mix(in srgb, var(--blue) 12%, white)",
  ["--usps-accent-wash" as string]: "color-mix(in srgb, var(--blue) 8%, white)",
  ["--usps-border" as string]: "color-mix(in srgb, var(--blue) 18%, white)",
  ["--usps-pill-fg" as string]: "var(--white)",
};

export const uspsTableThemeStyle: CSSProperties = {
  ...uspsPageThemeVars,
  ["--table-frame-border" as string]: "var(--usps-accent)",
  ["--table-head-background" as string]:
    "linear-gradient(135deg,var(--usps-accent)_0%,var(--usps-accent-deep)_100%)",
  ["--table-head-text" as string]: "var(--white)",
  ["--table-row-even-bg" as string]: "var(--usps-accent-wash)",
  ["--table-row-odd-bg" as string]: "var(--usps-surface)",
  ["--table-row-hover-filter" as string]: "brightness(0.98)",
  ["--table-row-divider" as string]:
    "color-mix(in srgb, var(--usps-accent) 14%, transparent)",
};
