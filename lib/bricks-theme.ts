import type { CSSProperties } from "react";

import type { BricksSubset } from "@/lib/bricks-types";

const baseBricksThemeVars: CSSProperties = {
  ["--bricks-surface" as string]: "var(--white)",
  ["--bricks-surface-muted" as string]: "var(--cream)",
  ["--bricks-ink" as string]: "var(--ink)",
  ["--bricks-link" as string]: "var(--blue)",
  ["--bricks-link-hover" as string]: "var(--blue-contrast)",
};

export const bricksPageThemeVarsBySubset: Record<BricksSubset, CSSProperties> =
  {
    lego: {
      ...baseBricksThemeVars,
      ["--bricks-accent" as string]:
        "color-mix(in srgb, var(--gold) 56%, var(--blue) 44%)",
      ["--bricks-accent-deep" as string]:
        "color-mix(in srgb, var(--gold) 30%, var(--blue) 70%)",
      ["--bricks-accent-soft" as string]:
        "color-mix(in srgb, var(--gold) 18%, white)",
      ["--bricks-accent-wash" as string]:
        "color-mix(in srgb, var(--gold) 8%, white)",
      ["--bricks-border" as string]:
        "color-mix(in srgb, var(--gold) 28%, var(--blue) 22%)",
      ["--bricks-pill-fg" as string]: "var(--white)",
    },
  };

export const bricksTableThemeStyleBySubset: Record<
  BricksSubset,
  CSSProperties
> = {
  lego: {
    ...bricksPageThemeVarsBySubset.lego,
    ["--table-frame-border" as string]: "var(--bricks-accent)",
    ["--table-head-background" as string]:
      "linear-gradient(135deg,var(--bricks-accent)_0%,var(--bricks-accent-deep)_100%)",
    ["--table-head-text" as string]: "var(--white)",
    ["--table-row-even-bg" as string]: "var(--bricks-accent-wash)",
    ["--table-row-odd-bg" as string]: "var(--bricks-surface)",
    ["--table-row-hover-filter" as string]: "brightness(0.98)",
    ["--table-row-divider" as string]:
      "color-mix(in srgb, var(--bricks-accent) 14%, transparent)",
  },
};
