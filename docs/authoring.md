# Content authoring

## Chronicles

Chronicles live in content/chronicles/\*.mdx and publish under /shaolin.
`npm run new-chronicle -- "Title"` creates a stub; inspect the result and nearby
posts before editing. Contentlayer requires title, date, summary; optional fields
include tags, draft, infinityStone, cover, canonical, and alterEgo.

Use exact MDX component names and string-literal inferred props. Every
ReleaseSection needs one literal alterEgo. See [inference](contentlayer-inference.md)
and [contentlayer.config.ts](../contentlayer.config.ts). Preserve explicit feed
props. Relative Markdown images and FolderImageCarousel folders resolve within
the Chronicle slug, including Bricks extracted sections through
[ChronicleSectionMdxRenderer](../components/chronicles/ChronicleSectionMdxRenderer.tsx).
See [images](images.md) for global versus Chronicle paths.
Run prepare:content to validate inferred data; validate-frontmatter only scans
static app page.mdx files and does not validate Chronicles.

## Static pages

`npm run new-page -- <slug> "Title"` takes positional arguments, with no prompts
or automatic validation. It writes app/<slug>/page.mdx, imports Hero and
buildPageMetadata, and includes title, description, canonical, and hero metadata.
It can overwrite an existing page; inspect the destination first.

Fill in description and hero alt text; maintain sequential headings, descriptive
links, unique metadata, and accessible components. Hero and metadata helpers are
[components/Hero.tsx](../components/Hero.tsx) and
[lib/page-metadata.ts](../lib/page-metadata.ts).

Put hero.jpg in public/images/source and run the output-folder optimizer from
[images](images.md). The script does not require a source/<slug> directory.
Processed source files are removed on success; keep originals elsewhere if needed.

Run validate-frontmatter, validate-seo, images:check, and lint:metadata separately
from the baseline in [validation](validation.md). The scaffold uses 1200x675;
validate-seo expects a hero ratio within 0.05 of 1.91. Supply an appropriately
sized actual hero and update its width/height rather than falsifying dimensions.
Dev startup does not automatically run these checks. Performance/accessibility
budgets in the [archived v2 proposal](archive/static-page-template-v2.md) remain
proposals, not enforced guarantees.

User previews are handled locally; agents must not start the dev server.
