# Typography

This site self-hosts [Inter](https://fonts.google.com/specimen/Inter) as the primary sans-serif face and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for monospace accents.

## Usage

Fonts are defined in `app/fonts.ts` using `next/font/google` with CSS variables:

```ts
import { inter, jbMono } from "@/app/fonts";
```

The variables are attached to the `<html>` element in `app/layout.tsx`:

```tsx
<html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
```

Tailwind exposes them as `font-sans` and `font-mono` utilities.

## Variable axes

Both imports load variable fonts. Inter exposes `wght` (weight) by default and adds `opsz` (optical size) via the `axes` option. JetBrains Mono provides the `wght` axis:

```ts
import { Inter, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"], // `wght` is implicit
});

export const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbmono",
});

## Demo

Visit `/typography-demo` to see the hierarchy and monospace usage.
