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

## Editorial callouts

These components are available in MDX without imports. All accept normal prose,
lists, links, emphasis, PersonTag, and an optional className.
CipherSays and LuluLearns are dateless. ScrollAmendment inherits the Chronicle's
frontmatter calendar date, including separately rendered sections; a nonblank
explicit date wins. Outside Chronicles, an omitted date leaves only the label.
Dates display as YYYY-MM-DD; no current-date fallback is used.
LuluLearns uses a soft pink surface with dark plum prose, links, and list markers;
its plum label and hovered links use white text.

```mdx
<LuluLearns>Small discoveries deserve a place to grow.</LuluLearns>

<CipherSays>Keep the shared behavior in one place.</CipherSays>

<ScrollAmendment>
  This note uses the Chronicle's frontmatter date.
</ScrollAmendment>

<ScrollAmendment date="2026-10-03">
  This correction has its own date.
</ScrollAmendment>
```

## Tag destinations

Every tag reference uses the matching `dojo.tags.href`, regardless of `href_kind`.
Slugs are trimmed, lowercased, and whitespace becomes hyphens. A missing row or
null, empty, or whitespace-only href falls back to
`/shaolin/tags/${encodeURIComponent(normalizeTagSlug(tag))}`. Metadata with
`is_clickable=false` or `href_kind=none` renders a non-clickable label; it never
falls back. Authored `href` props and persona context cannot override this rule.
Display labels and Contentlayer inference remain independent of routing.

Use `PersonTag` for inferred tags and `TagLink tag="..."` for ordinary inline tag
references without adding inferred tags. Markdown links explicitly pointing to
Chronicle archives remain archive navigation, such as links to archive comments.
The tag directory links each tag name canonically and separately labels its
Chronicle archive. Snapshot rank numbers, dedicated ranking actions, canonical
metadata, and ordinary page navigation retain their purpose-specific URLs.
