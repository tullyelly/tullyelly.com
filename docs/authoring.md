# Adding a Static Page

1. Run `npm run new-page <slug> "Title"` and answer the prompts.
2. Drop the source hero image at `public/images/source/hero.jpg` (will optimize to `public/images/optimized/<slug>/hero.webp`).
3. Edit frontmatter and content in `app/<slug>/page.mdx`.
4. Run `npm run images:optimize -- "<slug>"` to generate optimized WebP outputs; the entire source folder is cleared on success.
5. Validate metadata and images: `npm run validate-frontmatter && npm run validate-seo && npm run images:check`.
6. Preview locally with `npm run dev`.
7. Commit, push, and open a PR when ready.

Notes

- Use `<FolderImageCarousel folder="..."/>` in `app/<slug>/page.mdx`; the folder is relative to `public/images/optimized`.
