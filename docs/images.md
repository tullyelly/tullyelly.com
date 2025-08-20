# Image Guidelines

- Optimized assets live under `public/images/optimized` and are committed to the repo.
- Paths passed to `<Image>` or `<img>` must start with a leading slash (e.g. `/images/optimized/cardattack.webp`).
- When a request to `/_next/image` fails, the response body describes the problem (e.g., `"url" parameter is invalid`).
- During debugging you can bypass optimization with the `unoptimized` prop on `next/image`.
