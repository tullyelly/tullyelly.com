1. **Lessons Learned from First Two Pages**

   * **What worked**
     - Base layout, design tokens, and image pipeline were reusable across pages
     - Simple `<article>` + hero structure enforced a coherent skeleton

   * **What didn’t / friction**
     - Metadata and Open Graph info duplicated and hand‑maintained per page
     - Canonical URLs, category tags, and structured data missing; OG tags manually patched
     - Authoring required hand-written figure/alt markup and manual image optimization
     - A11y/SEO reviews flagged heading skips and inconsistent alt text; no automated guardrails
     - CI review overhead: repeated manual checks for image weights and OG assets

2. **Refined Objectives (Success Criteria)**

   * Author new static page in ≤45 s via scaffold and schema validation.
   * Single metadata/frontmatter contract with defaults for canonical, OG image, and JSON‑LD.
   * A11y/SEO guardrails: lint rules for headings, alt text, and schema‑validated frontmatter.
   * Performance budget: hero <150 KB, LCP <2.5 s, total JS <50 KB, image optimization auto‑checked.

3. **Information Architecture & Authoring Flow v2**

   * **Anticipated page types**
     - Hero-first article
     - Campaign/landing variant (CTA block)
     - Gallery-lite (grid of images)

   * **Authoring flow**
     1. Create content stub via `npm run new-page` (generates MDX with frontmatter).
     2. Fill frontmatter (`title`, `description`, `hero`, `category`, etc.).
     3. Write content using Markdown/MDX components.
     4. Local preview (`npm run dev`) auto-validates metadata.
     5. Open PR; CI runs lint, schema, image checks.

4. **Metadata & Frontmatter Specification (Refined)**

   | Field        | Type / Example                             | Notes                                |
   |--------------|--------------------------------------------|--------------------------------------|
   | `title`      | string                                     | Required, used for `<h1>` & `<title>`|
   | `description`| string                                     | Required meta description            |
   | `canonical`  | URL string                                 | Required; auto-generated fallback    |
   | `category`   | enum (`music`, `video`, `campaign`)        | Optional for grouping                |
   | `hero`       | object `{src, alt, width, height}`         | Required; drives OG image            |
   | `cta`        | object `{label, href}`                     | Optional for campaign pages          |
   | `tags`       | string[]                                   | Optional search facets               |
   | `legacy`     | *(deprecated)* `ogImage`                   | Superseded by `hero`                 |

5. **Template Markup Contract (Iteration)**

   * `<article>` root with `aria-labelledby` linking to `<h1>`.
   * Heading hierarchy must not skip levels; subsections start at `<h2>`.
   * `<Hero>` component outputs `<figure>` with `Image` and `<figcaption>`.
   * Inline images via `<Image>`; blockquotes wrapped in `<blockquote><p>…</p><cite/></blockquote>`.
   * Callouts implemented as `<aside role="note" class="callout">`.

6. **Accessibility Baseline (Refined)**

   * Sequential headings, `alt` text, descriptive link text.
   * Focus styles, color contrast, `lang` attribute, skip link.
   * Automated lint rules and `axe-core` scans in CI.

7. **SEO/OG Minimums (Reinforced)**

   * Unique title, meta description, canonical link.
   * OG title/description/image (1200×630) and Twitter card.
   * JSON‑LD `Article` or `WebPage` schema required.
   * CI validates canonical presence and OG image ratio (1.91:1).

8. **Performance Budget & Image Strategy (Hardened)**

   * Targets: LCP <2.5 s on 3G, TTI <3 s, total image bytes <300 KB.
   * Hero image <150 KB; inline images lazy‑load and use AVIF/WebP.
   * Max width 1920 px, mandatory `sizes` attribute, defer non-critical JS.

9. **File/Folder Layout (Stabilized)**

   ```
   /app
     /[slug]
       page.mdx          # content + frontmatter
   /content
     /[slug]
       hero.jpg
   /components
     Hero.tsx
   /public/images
     /[slug]            # optimized assets
   ```

10. **Authoring UX: “Add a Page in 45 Seconds”**

    1. `npm run new-page` prompts for slug/title.
    2. Drop source hero image into `/content/<slug>/hero.jpg`.
    3. Edit frontmatter and write content in `/app/<slug>/page.mdx`.
    4. `npm run images:optimize` generates `/public/images/<slug>/` variants.
    5. `npm run dev` previews page and surfaces frontmatter violations.
    6. Commit, push, open PR.

11. **Review & CI Gates (Tightened)**

    * `npm run lint`
    * `npm run typecheck`
    * `npm run images:check`
    * `npm run validate-frontmatter`
    * `npm run validate-seo`
    * `npm run build`

12. **Risks & Mitigations (Iteration)**

   | Risk                                  | Mitigation                                      |
   |---------------------------------------|-------------------------------------------------|
   | Authors bypass schema or lint checks  | Pre-commit hook running validation scripts      |
   | Image optimization skipped            | `images:check` fails CI with clear error        |
   | Accessibility regressions             | CI `axe-core` scan and checklist in PR template |
   | Metadata drift                        | Central metadata builder with schema validation |

13. **Open Questions for Stakeholders**

   * Who owns ongoing SEO strategy and structured data definitions?
   * Do we need campaign-style variants with external CTAs now or later?
   * Timeline for localization / i18n and related metadata?
   * What analytics instrumentation is required on static pages?
   * Should gallery-lite pages support lightbox or just static images?
   * Preferred process for uploading large media (videos, audio)?

14. **Acceptance Criteria (for Iterated Story 3)**

   * Lessons learned from existing pages captured.
   * Metadata/frontmatter contract updated and documented.
   * Template markup contract refined with `Hero`, `Callout`, `Quote`.
   * A11y/SEO/performance checklists enhanced and automated.
   * File/folder layout and authoring flow stabilized with scaffold script.
   * CI gates proposed and documented.
   * Open questions enumerated for stakeholder follow-up.

15. **Mini-Roadmap: Build Next**

   * Implement `PageFrontmatter` interface & schema validator.
   * Create `Hero`, `Callout`, `Quote` MDX components.
   * Write `scripts/new-page.mjs` scaffold.
   * Refactor existing pages to MDX + shared metadata builder.
   * Update image optimizer for OG asset auto-generation.
   * Add `validate-seo.mjs` and integrate into CI.
   * Document new authoring SOP in `docs/authoring.md`.
   * Configure pre-commit hooks and CI workflow.

---

**Decision Brief**

Generalize static pages by introducing a shared metadata/frontmatter schema, MDX-based content with reusable components, and automated a11y/SEO/performance guardrails. A scaffold script, clearer file layout, and stricter CI gates cut authoring time to ≤45 s while improving consistency and future extensibility.

