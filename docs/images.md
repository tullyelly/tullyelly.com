# Image Guidelines

- Optimized assets live under `public/images/optimized` and are typically generated via `npm run images:optimize -- "<folder>"`.
- Source assets live under `public/images/source/`; the optimizer clears the source folder on success.
- Animated sources (`.gif`, `.mp4`) use `npm run images:animated -- "<folder>"` to generate WebP outputs; processed sources are removed on success.
- Outputs land in `public/images/optimized/<folder>`.
- Paths passed to `<Image>` or `<img>` must start with a leading slash (e.g. `/images/optimized/cardattack.webp`).
- `FolderImageCarousel` accepts a `folder` relative to the optimized root; do not pass `/images/optimized/...`.
- `FolderImageCarousel` scans nested folders n levels deep.
- When a request to `/_next/image` fails, the response body describes the problem (e.g., `"url" parameter is invalid`).
- During debugging you can bypass optimization with the `unoptimized` prop on `next/image`.
