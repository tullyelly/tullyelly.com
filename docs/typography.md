# Typography

This site uses **Inter** for proportional sans (body/headings) and **JetBrains Mono** for monospace accents (code/meta). Fonts are self-hosted and applied via `next/font` with CSS variables.

## Usage

- Defined in `app/fonts.ts` and attached in `app/layout.tsx`:

  ```tsx
  <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
    <body className="font-sans">{/* … */}</body>
  </html>
  ```

- Tailwind utilities:
  - `font-sans` → Inter stack
  - `font-mono` → JetBrains Mono stack

## Where to tweak

- **Weights / axes**: adjust in `app/fonts.ts` (variable font ranges).
- **Default body font**: `app/layout.tsx` (`className="font-sans"` on `<body>`).
- **Code snippets**: apply `className="font-mono"` or global CSS for `code, pre, kbd, samp`.

## Performance notes

- Fonts are self-hosted WOFF2; `display: "swap"` minimizes CLS.
- Verify no external font hosts in DevTools → Network (should serve from same origin).

## Quick checks

- Build: `npm run build`
- Test: `npm test`
- Lighthouse (optional): run against `/mark2/shaolin-scrolls`; CLS should be ≤ 0.01
