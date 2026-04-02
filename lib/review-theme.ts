import type { CSSProperties } from "react";

import type { ReviewType } from "@/lib/review-types";

const baseReviewThemeVars: CSSProperties = {
  ["--review-surface" as string]: "var(--white)",
  ["--review-surface-muted" as string]: "var(--cream)",
  ["--review-ink" as string]: "var(--ink)",
  ["--review-link" as string]: "var(--blue)",
  ["--review-link-hover" as string]: "var(--blue-contrast)",
};

export const reviewPageThemeVarsByType: Record<ReviewType, CSSProperties> = {
  lcs: {
    ...baseReviewThemeVars,
    ["--review-accent" as string]: "var(--blue)",
    ["--review-accent-deep" as string]: "var(--blue-contrast)",
    ["--review-accent-soft" as string]: "color-mix(in srgb, var(--blue) 12%, white)",
    ["--review-accent-wash" as string]: "color-mix(in srgb, var(--blue) 8%, white)",
    ["--review-border" as string]: "color-mix(in srgb, var(--blue) 18%, white)",
    ["--review-pill-fg" as string]: "var(--white)",
  },
  "table-schema": {
    ...baseReviewThemeVars,
    ["--review-accent" as string]: "var(--table-schema-spice)",
    ["--review-accent-deep" as string]:
      "color-mix(in srgb, var(--table-schema-spice) 88%, black)",
    ["--review-accent-soft" as string]:
      "color-mix(in srgb, var(--table-schema-spice) 14%, white)",
    ["--review-accent-wash" as string]:
      "color-mix(in srgb, var(--table-schema-spice) 8%, white)",
    ["--review-border" as string]:
      "color-mix(in srgb, var(--table-schema-spice) 22%, white)",
    ["--review-pill-fg" as string]: "var(--white)",
  },
  "save-point": {
    ...baseReviewThemeVars,
    ["--review-accent" as string]:
      "color-mix(in srgb, var(--blue) 62%, var(--green))",
    ["--review-accent-deep" as string]:
      "color-mix(in srgb, var(--blue) 30%, var(--green) 70%)",
    ["--review-accent-soft" as string]:
      "color-mix(in srgb, var(--blue) 10%, white)",
    ["--review-accent-wash" as string]:
      "color-mix(in srgb, var(--green) 8%, white)",
    ["--review-border" as string]:
      "color-mix(in srgb, var(--green) 18%, white)",
    ["--review-pill-fg" as string]: "var(--white)",
  },
  "golden-age": {
    ...baseReviewThemeVars,
    ["--review-accent" as string]:
      "color-mix(in srgb, var(--gold) 44%, var(--green) 56%)",
    ["--review-accent-deep" as string]:
      "color-mix(in srgb, var(--gold) 22%, var(--green) 78%)",
    ["--review-accent-soft" as string]:
      "color-mix(in srgb, var(--gold) 24%, white)",
    ["--review-accent-wash" as string]:
      "color-mix(in srgb, var(--gold) 14%, white)",
    ["--review-border" as string]:
      "color-mix(in srgb, var(--gold) 34%, var(--green) 66%)",
    ["--review-pill-fg" as string]: "var(--white)",
  },
};

export const reviewTableThemeStyleByType: Record<ReviewType, CSSProperties> = {
  lcs: {
    ...reviewPageThemeVarsByType.lcs,
    ["--table-frame-border" as string]: "var(--review-accent)",
    ["--table-head-background" as string]:
      "linear-gradient(135deg, var(--review-accent) 0%, var(--review-accent-deep) 100%)",
    ["--table-head-text" as string]: "var(--white)",
    ["--table-row-even-bg" as string]: "var(--review-accent-wash)",
    ["--table-row-odd-bg" as string]: "var(--review-surface)",
    ["--table-row-hover-filter" as string]: "brightness(0.98)",
    ["--table-row-divider" as string]:
      "color-mix(in srgb, var(--review-accent) 14%, transparent)",
  },
  "table-schema": {
    ...reviewPageThemeVarsByType["table-schema"],
    ["--table-frame-border" as string]: "var(--review-accent)",
    ["--table-head-background" as string]:
      "linear-gradient(135deg, var(--review-accent) 0%, var(--review-accent-deep) 100%)",
    ["--table-head-text" as string]: "var(--white)",
    ["--table-row-even-bg" as string]: "var(--review-accent-wash)",
    ["--table-row-odd-bg" as string]: "var(--review-surface)",
    ["--table-row-hover-filter" as string]: "brightness(0.98)",
    ["--table-row-divider" as string]:
      "color-mix(in srgb, var(--review-accent) 14%, transparent)",
  },
  "save-point": {
    ...reviewPageThemeVarsByType["save-point"],
    ["--table-frame-border" as string]: "var(--review-accent)",
    ["--table-head-background" as string]:
      "linear-gradient(135deg, var(--review-accent) 0%, var(--review-accent-deep) 100%)",
    ["--table-head-text" as string]: "var(--white)",
    ["--table-row-even-bg" as string]: "var(--review-accent-wash)",
    ["--table-row-odd-bg" as string]: "var(--review-surface)",
    ["--table-row-hover-filter" as string]: "brightness(0.98)",
    ["--table-row-divider" as string]:
      "color-mix(in srgb, var(--review-accent) 14%, transparent)",
  },
  "golden-age": {
    ...reviewPageThemeVarsByType["golden-age"],
    ["--table-frame-border" as string]: "var(--review-accent)",
    ["--table-head-background" as string]:
      "linear-gradient(135deg, var(--review-accent) 0%, var(--review-accent-deep) 100%)",
    ["--table-head-text" as string]: "var(--white)",
    ["--table-row-even-bg" as string]: "var(--review-accent-wash)",
    ["--table-row-odd-bg" as string]: "var(--review-surface)",
    ["--table-row-hover-filter" as string]: "brightness(0.98)",
    ["--table-row-divider" as string]:
      "color-mix(in srgb, var(--review-accent) 14%, transparent)",
  },
};
