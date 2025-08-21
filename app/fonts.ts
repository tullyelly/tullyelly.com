import { Inter, JetBrains_Mono } from "next/font/google";

// Axis control: customize `weight`, `style`, or other supported axes as needed.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  // weight: ["400", "700"], // example axis control
});

// JetBrains Mono also supports axis customization like `weight`.
export const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbmono",
  // weight: ["400", "700"], // example axis control
});
