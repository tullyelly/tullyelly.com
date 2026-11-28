# Frontend facelift design contract

WU-1288 under WU-1000. Inspected main `5dbe09d8` on November 28, 2026.
This is the implementation design, not a claim of prior owner visual approval.
No unresolved product decision prevents the planned presentation work.

## Direction and hierarchy

Compact directories lead to richer profiles. Retain the existing persona themes,
public paths, authored introductions and media. Reuse DataPageShell,
FullBleedPage, PageIntro, SectionHeader, DataToolbar, TableSearch, TablePager,
Card, StatGrid and the existing Radix wrappers. Extend these primitives instead
of replacing routing, fetching or permissions.

Use the standard 72rem content rail for directories; wide 76rem/82rem only for
multi-column profiles and dense collection tables. Reading sections remain at
72ch. At 375px, use 16px gutters, one column, wrapping names, and full-width
controls. At 768px and above, controls form a wrapping toolbar; detail sections
can use two columns only when both remain readable. Never absolutely position a
long profile title between fixed-width actions.

One h1 identifies the page (30px mobile, 36px desktop, tight line height).
Eyebrows give persona/context, not implementation. Introductions use 16px/18px
body text and 1.6 line height. h2 section titles use 20px/24px; secondary metadata
uses 14px and must remain readable. Existing tokens own colors, borders and
surfaces. Spacing: 8px within field groups, 16px inside cards, 24px between related
modules and 32px between major sections. Focus indicators use existing tokens.

Directory hierarchy: identity and concise introduction; at most three relevant
summary values; controls and result count; compact rows/cards; pagination; any
existing supporting Chronicle section. Summary numbers describe the whole
collection; the result count describes the filtered subset. Do not silently
recalculate whole-collection totals from the current page.

Detail hierarchy: safe directory return; identity and context; relevant dated
summary; optional section links; relationships; history/collection content;
authored story/media and Chronicles in their established meaningful order.
Custom Fam stories may precede data modules. Do not replace Bonnibel or Jeff Meff
with generic identity cards. Group membership, aliases and collection motivations
are separately labeled. Multi-sport clans show separate sport measurements;
overlapping collection counts must not become a fabricated distinct-card total.

## Browse-state contract

Universal for comparable directories: labeled search, result count, clear/reset
when state differs from defaults, stable ordering, empty/no-match distinction,
and visible identity links. Sorting/filtering/paging are capability-specific.
Do not add meaningless filters or rank artists by nonexistent card counts.

Use `q`, `sort`, `page`, `pageSize` and existing domain keys (`sport`, `trend`,
`category`, `state`, `status`, `alterEgo`). Preserve existing public query keys.
Trim search for matching; case-insensitive matching includes known aliases.
Default query values may be omitted from the URL. Invalid enum values fall back
to defaults; positive integer pages are bounded to available results. Filter,
search, sort and page-size changes reset the page to 1. Clear resets only that
directory's supported state and preserves unrelated query parameters.

Defaults: Homies retain card-count descending order with supported name/rank alternatives;
Clans retain existing server ordering and paging; identity lists use name then
slug; sets retain repository ordering; visits/reviews use latest first; trades
use newest first; tags use usage then name; Chronicles/releases use newest first.
Null numeric/date values sort last, and ties use a stable name/ID key. Existing
server-paged directories stay server-paged; do not fetch all rows to sort locally.

Reload and shared links restore browse state. Back/Forward restores controls and
results. Typing uses replace history to avoid a history entry per character;
explicit filter/sort/page changes use push history. A detail link carries the
current directory path/query as an encoded `returnTo` when needed. Validate it
against the exact expected directory pathname, reject external/protocol-relative
URLs, credentials, malformed encodings and nested return parameters, and preserve
only supported browse keys. Direct entry has a real directory anchor fallback;
never rely exclusively on history.back(). Canonical metadata excludes returnTo.

## States and accessibility

Zero is a recorded value. Missing measurement says "Not available" with its date
omitted; never turn null into zero. Empty source says no entries yet; filtered
empty says no matches and offers reset. A failed source says unavailable with
retry where supported; it must not masquerade as an empty collection. Loading
reserves the actual section space and exposes a polite busy status.

Use real links for navigation and buttons for actions; no clickable-row-only
interaction. Forms have visible or accessible labels and controls target a stable
results ID. Announce result counts politely, without moving focus on each input.
Sortable table headings expose aria-sort. Mobile cards repeat labels for dates,
counts and status; desktop tables retain header associations. Only one responsive
representation is visible to assistive technology. Touch targets are at least
44px where practical; no essential hover-only content. Keyboard order follows
visual order. Section links use stable IDs and account for the fixed header.
Dialogs preserve accessible title/description, Escape, focus containment and
return. Charts include readable summaries or data alternatives. Images retain
existing alternative text and dimensions; embeds retain lazy behavior.

## Capability boundaries

Universal presentation does not imply universal write capabilities. Keep existing
snapshot/edit controls only where server authorization currently grants them.
Identity directories, music identities and crates do not gain editors. Existing
collection history, visits, ratings, comments, album sources, rankings and
completion retain their domain meaning. No new SQL or API is needed for this
contract. Missing portraits, biographies, artist classifications, relationship
rows and unavailable measurements are data gaps; do not invent them or block
presentation work on filling them.

WU-1260 semantics remain: alias-equivalent posts deduplicate; distinct family and
athlete identities remain distinct; motivation does not pull every athlete post
into the family feed. Keep canonical redirects, disabled TagLink handling,
server authorization and request-isolated session checks. Keep cache tags and
freshness, and database-free production builds.

## Designs and rollout evidence

[Route inventory](routes.md) assigns every page to a rollout or explicit exclusion.
The adjacent fixture preview demonstrates Homies, athlete, multi-sport clan,
custom Fam, music and Set Collector with long names and sparse measurements at
375px and 1440px. Fixture values are illustrative, never live measurements.
The preview uses site CSS and existing theme variables without app/database calls.
It demonstrates proposed hierarchy, not completed production-route behavior.

Each rollout story owns its focused safe tests and rendered mobile/desktop
checks. Run the repository baseline before review/commit. Database-writing E2E
seeding is prohibited for agents; use isolated fixtures and clearly distinguish
these from connected Next/database journeys. Record implementation, verification,
manual SQL, merge and deployment separately. No release is authorized here.

Reproduce the design captures from the repository root with
`PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium node docs/facelift/render-preview.mjs`
(or omit that variable to use an installed Playwright browser). Outputs are the
standalone `.cache/facelift/preview.html` and twelve PNGs named by view and width.
The harness intercepts its fixture origin and never starts an application server
or connects to a database. All six examples passed page-width checks at 375px and
1440px; directory/mobile and clan/desktop captures were visually inspected.
The mobile search occupies a full row after correcting the first cramped layout.
