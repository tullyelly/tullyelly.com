# Adding a Static Page

1. `npm run new-page <slug> "Title"`
2. Drop a hero image at `public/images/optimized/<slug>/hero.webp`
3. Edit frontmatter and content in `app/<slug>/page.mdx`
4. `npm run images:optimize`
5. `npm run validate-frontmatter && npm run validate-seo`
6. `npm run dev` and open a PR when ready
