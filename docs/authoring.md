# Adding a Static Page

1. Run `npm run new-page` and answer the slug and title prompts.
2. Drop the source hero image at `content/<slug>/hero.jpg`.
3. Edit frontmatter and write content in `app/<slug>/page.mdx`.
4. Run `npm run images:optimize` to generate `public/images/<slug>/` variants.
5. Validate metadata and images: `npm run validate-frontmatter && npm run validate-seo && npm run images:check`.
6. Preview locally with `npm run dev`.
7. Commit, push, and open a PR.
