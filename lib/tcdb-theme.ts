import type { CSSProperties } from "react";

const tcdbTradeThemeVars: CSSProperties = {
  ["--trade-rust" as string]: "#B45028",
  ["--trade-rust-deep" as string]: "#A84822",
  ["--trade-rust-soft" as string]: "#F1E3DB",
  ["--trade-rust-wash" as string]: "#F4E2D9",
  ["--trade-blue" as string]: "var(--blue)",
  ["--trade-blue-soft" as string]: "#E9F0FF",
  ["--trade-off-white" as string]: "#F8F8F8",
  ["--trade-charcoal" as string]: "#303828",
  ["--trade-border" as string]: "#D8CDC6",
};

export const tcdbTradePageThemeVars = tcdbTradeThemeVars;

export const tcdbTradeTableThemeStyle: CSSProperties = {
  ...tcdbTradeThemeVars,
  ["--table-frame-border" as string]: "var(--trade-rust)",
  ["--table-head-background" as string]:
    "linear-gradient(135deg, var(--trade-rust) 0%, var(--trade-rust-deep) 100%)",
  ["--table-head-text" as string]: "var(--trade-off-white)",
  ["--table-row-even-bg" as string]: "var(--trade-rust-wash)",
  ["--table-row-odd-bg" as string]: "var(--trade-off-white)",
  ["--table-row-hover-filter" as string]: "brightness(0.97)",
  ["--table-row-divider" as string]:
    "color-mix(in srgb, var(--trade-rust) 14%, transparent)",
};

export const tcdbTradeInspiredRankingsTheme = {
  tableThemeStyle: {
    ...tcdbTradeTableThemeStyle,
  },
  detailDialogStyle: {
    ...tcdbTradeThemeVars,
    ["--ranking-dialog-shell-bg" as string]: "#FBF7F4",
    ["--ranking-dialog-text" as string]: "var(--trade-charcoal)",
    ["--ranking-dialog-border" as string]: "var(--trade-rust-soft)",
    ["--ranking-dialog-ring" as string]: "var(--trade-rust)",
    ["--ranking-dialog-header-background" as string]:
      "linear-gradient(135deg, var(--trade-rust) 0%, var(--trade-rust-deep) 100%)",
    ["--ranking-dialog-header-fg" as string]: "var(--trade-off-white)",
    ["--ranking-dialog-header-button-bg" as string]:
      "rgba(255, 255, 255, 0.16)",
    ["--ranking-dialog-header-button-hover-bg" as string]:
      "rgba(255, 255, 255, 0.28)",
    ["--ranking-dialog-header-ring-offset" as string]: "var(--trade-rust-deep)",
    ["--ranking-dialog-surface-bg" as string]: "var(--trade-off-white)",
    ["--ranking-dialog-surface-border" as string]: "var(--trade-border)",
    ["--ranking-dialog-label" as string]:
      "color-mix(in srgb, var(--trade-charcoal) 72%, white)",
  },
} as const;
