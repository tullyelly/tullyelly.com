import { Inter, JetBrains_Mono } from "next/font/google";

// Variable font imports let you control axes like weight (`wght`) and optical size (`opsz`).
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"], // `wght` is included by default
});

// JetBrains Mono exposes the `wght` axis, included automatically.
// You can also customize `weight` if you want specific ranges.
export const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbmono",
});