// app/fonts.ts
import localFont from "next/font/local";

export const inter = localFont({
  src: [
    {
      // note: path is literal and relative to this file (app/ -> ../public/…)
      path: "../public/fonts/inter/inter-latin-wght-normal.woff2",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../public/fonts/inter/inter-latin-wght-italic.woff2",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const jbMono = localFont({
  src: [
    {
      path: "../public/fonts/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2",
      style: "normal",
      weight: "100 800",
    },
    {
      path: "../public/fonts/jetbrains-mono/jetbrains-mono-latin-wght-italic.woff2",
      style: "italic",
      weight: "100 800",
    },
  ],
  variable: "--font-jbmono",
  display: "swap",
});