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
