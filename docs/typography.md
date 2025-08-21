# Typography

This site self-hosts [Inter](https://fonts.google.com/specimen/Inter) as the primary sans-serif face and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for monospace accents.

## Usage

Fonts are defined in `app/fonts.ts` using `next/font/google` with CSS variables:

```ts
import { inter, jetbrainsMono } from "@/app/fonts";
```

The variables are attached to the `<html>` element in `app/layout.tsx`:

```tsx
<html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
```

Tailwind exposes them as `font-sans` and `font-mono` utilities.

## Demo

Visit `/typography-demo` to see the hierarchy and monospace usage.
