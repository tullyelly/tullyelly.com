import { Inter, JetBrains_Mono } from "next/font/google";

// Variable font imports enable control over axes like weight (`wght`) and optical size (`opsz`).
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"], // `wght` is included by default
});

// JetBrains Mono exposes only the `wght` axis, which is included automatically.
export const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbmono",
});
