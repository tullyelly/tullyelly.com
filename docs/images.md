# Image Guidelines

- Optimized assets live under `public/images/optimus` and are typically generated via `npm run images:optimus -- "<folder>"`.
- Source assets live under `public/images/source/`; processed source files are removed on success.
- `npm run images:optimus` always reads from `public/images/source/`.
- The optional `<folder>` is an output folder only; outputs land in `public/images/optimus/<folder>/`.
- `npm run images:optimus` uses the still-image optimizer for `.jpg`, `.jpeg`, `.png`, `.webp`, and `.tiff`, and the animated pipeline for `.gif` and `.mp4`.
- Passing `npm run images:optimus -- "<slug>"` does not require `public/images/source/<slug>/` to exist and does not create it.
- Outputs land in `public/images/optimus/<folder>`.
- Paths passed to `<Image>` or `<img>` must start with a leading slash (e.g. `/images/optimus/cardattack.webp`).
- `FolderImageCarousel` accepts a `folder` relative to the optimus root; do not pass `/images/optimus/...`.
- `FolderImageCarousel` scans nested folders n levels deep.
- When a request to `/_next/image` fails, the response body describes the problem (e.g., `"url" parameter is invalid`).
- During debugging you can bypass optimization with the `unoptimized` prop on `next/image`.

## Asset Size Reporting

Run the read-only asset report when you want a quick view of repo image and media growth:

```bash
npm run assets:report
```

The report scans:

- `public/images/optimus`
- `public/images/source`
- `public/videos`

It shows total size by folder, the largest 20 files, source or raw files that may not belong in the repo, and large animated WebP or media files. It never deletes files.

Use the optional check when you want the report to fail after thresholds are exceeded:

```bash
npm run assets:check
```

Default thresholds:

| Limit              | Default |
| ------------------ | ------- |
| Total scanned      | 750 MiB |
| Optimized images   | 650 MiB |
| Source images      | 25 MiB  |
| Media folder       | 100 MiB |
| Single file        | 15 MiB  |
| Animated WebP file | 8 MiB   |
| Media file         | 25 MiB  |

Override thresholds with environment variables when a branch needs a temporary or stricter budget:

- `ASSETS_MAX_TOTAL_MB`
- `ASSETS_MAX_OPTIMUS_MB`
- `ASSETS_MAX_SOURCE_MB`
- `ASSETS_MAX_MEDIA_MB`
- `ASSETS_MAX_FILE_MB`
- `ASSETS_MAX_ANIMATED_WEBP_MB`
- `ASSETS_MAX_MEDIA_FILE_MB`
