# Image Guidelines

- Optimized assets live under `public/images/optimized` and are committed to the repo.
- Source assets live under `public/images/source/`; run `npm run images:optimize -- "<folder>"` to generate outputs and clear the source folder on success.
- Animated sources (`.gif`, `.mp4`) use `npm run images:animated -- "<folder>"` to generate WebP outputs; processed sources are removed on success.
- Outputs land in `public/images/optimized/<folder>`.
- Paths passed to `<Image>` or `<img>` must start with a leading slash (e.g. `/images/optimized/cardattack.webp`).
- When a request to `/_next/image` fails, the response body describes the problem (e.g., `"url" parameter is invalid`).
- During debugging you can bypass optimization with the `unoptimized` prop on `next/image`.
