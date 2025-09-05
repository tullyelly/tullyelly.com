# Adding a Static Page

1. Run `npm run new-page <slug> "Title"` and answer the prompts.
2. Drop the source hero image at `content/<slug>/hero.jpg` (will optimize to `public/images/optimized/<slug>/hero.webp`).
3. Edit frontmatter and content in `app/<slug>/page.mdx`.
4. Run `npm run images:optimize` to generate optimized variants.
5. Validate metadata and images: `npm run validate-frontmatter && npm run validate-seo && npm run images:check`.
6. Preview locally with `npm run dev`.
7. Commit, push, and open a PR when ready.

## UI Lab

The `/ui-lab` page showcases design tokens and reusable components.

### Adding a demo tile

1. Edit `app/ui-lab/DemoLab.tsx` and insert a new `<Card as="section" className="space-y-4">` tile (import `Card` from `@ui`) with a unique heading referenced by
   `aria-labelledby`.
2. Use theme tokens via Tailwind utilities; avoid inline styles.
3. Offer preset examples and, when helpful, controls that let visitors tweak props live.
4. Ensure interactive elements have accessible names and focus styles.

### Accessibility & tests

1. Add a unit test in `__tests__/` that renders the component and checks for accessibility with `jest-axe`.
2. Extend `e2e/ui-lab.spec.ts` to visit the tile and run `axe-core` checks in Playwright.
3. Before committing, run:

   ```bash
   npm test
   npm run lint
   npx playwright test e2e/ui-lab.spec.ts
   ```
