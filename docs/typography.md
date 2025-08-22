# Typography

This site self-hosts [Inter](https://fonts.google.com/specimen/Inter) as the primary sans-serif face and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for monospace accents.

## Usage

Fonts are defined in `app/fonts.ts` using `next/font/local` with CSS variables:

```ts
import localFont from "next/font/local";

export const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

export const jbMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  display: "swap",
  variable: "--font-jbmono",
});
```

The variables are attached to the `<html>` element in `app/layout.tsx`:

```tsx
<html lang="en" className={`${inter.variable} ${jbMono.variable}`}>```

Tailwind exposes them as `font-sans` and `font-mono` utilities.

## Variable axes

Inter exposes both `wght` (weight) and `opsz` (optical size) axes, while JetBrains Mono includes only `wght`.
Use `font-variation-settings` in CSS to tune these axes when needed:

```css
h1 { font-variation-settings: "wght" 700, "opsz" 72; }
```

## Demo

Visit `/typography-demo` to see the hierarchy and monospace usage.
