# Image Guidelines

- Optimized assets live under `public/images/optimized` and are typically generated via `npm run images:optimus -- "<folder>"`.
- Source assets live under `public/images/source/`; processed source files are removed on success.
- `npm run images:optimus` always reads from `public/images/source/`.
- The optional `<folder>` is an output folder only; outputs land in `public/images/optimized/<folder>/`.
- `npm run images:optimus` uses the still-image optimizer for `.jpg`, `.jpeg`, `.png`, `.webp`, and `.tiff`, and the animated pipeline for `.gif` and `.mp4`.
- Passing `npm run images:optimus -- "<slug>"` does not require `public/images/source/<slug>/` to exist and does not create it.
- Outputs land in `public/images/optimized/<folder>`.
- Paths passed to `<Image>` or `<img>` must start with a leading slash (e.g. `/images/optimized/cardattack.webp`).
- `FolderImageCarousel` accepts a `folder` relative to the optimized root; do not pass `/images/optimized/...`.
- `FolderImageCarousel` scans nested folders n levels deep.
- When a request to `/_next/image` fails, the response body describes the problem (e.g., `"url" parameter is invalid`).
- During debugging you can bypass optimization with the `unoptimized` prop on `next/image`.
