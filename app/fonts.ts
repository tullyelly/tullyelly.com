import localFont from "next/font/local";

// Inter variable font: weights 100–900, includes the optical-size (opsz) axis.
// Source: node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2
export const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

// JetBrains Mono variable font: weights 100–800.
// Source: node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2
export const jbMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  display: "swap",
  variable: "--font-jbmono",
});
