# Shared UI conventions

Inspect neighboring routes and shared primitives before adding abstractions.
Reuse components/ui shells, SectionHeader, DataToolbar, TableSearch, TablePager,
and responsive data cards where their existing contracts fit. Keep search,
filters, pagination, and row actions with their semantic owner.

Dialogs use Radix through existing wrappers:
[DialogPanel](../components/ui/DialogPanel.tsx),
[Modal](../components/ui/Modal.tsx), and
[dialog](../components/ui/dialog.tsx). Preserve title/description, focus return,
close behavior, and closed-state pointer events. Test the interaction changed,
including keyboard behavior; include screenshots in UI PRs.

Tailwind and [app/globals.css](../app/globals.css) own design tokens; do not add
inline hex colors or change palettes/personas. Use existing cn utilities.
Server authorization remains mandatory even when UI hides actions.
CipherSays, LuluLearns, and ScrollAmendment share ScrollCallout typography:
16px body text on small screens and 18px from the medium breakpoint, with matching
14px tab labels. Rich MDX paragraphs, lists, and inline content inherit the body
size; headings retain their MDX heading scale.
Follow [hydration](hydration.md) and [validation](validation.md) for deterministic
rendering and the appropriate Jest, Vitest, and browser checks.

The command search is non-modal so header and background controls remain
interactive. Radix mounts its content only while open, handles Escape and outside
dismissal, and loops Tab navigation. Its open autofocus targets the search input;
its close autofocus callback returns to the captured opener, retains focus on an
outside control used to dismiss it, or falls back to the connected search button
and then main content if navigation removed the opener. Closed command content
must be unmounted rather than hidden around a focused descendant.

Recharts charts with reserved pixel or calculated heights pass that same numeric
height to ResponsiveContainer while keeping responsive width. The TCDb traffic
chart uses a CSS-reserved responsive height (250px below md, 320px above) and
passes the numeric height to its container using a hydration-safe media-query
effect that updates only at the md breakpoint. Its existing Recharts resize callback
updates only label-capacity buckets; all daily data points remain plotted. Exact
values use an in-flow day selector and readout, with expandable daily data. The card-count
sparklines and category count/ranking history charts use Recharts' responsive LineChart measurement with 100% width and
height inside their h-24 wrappers; their height follows the root font size.
Do not guess positive initial dimensions or add a second resize observer around
Recharts. Real chart layout and warning coverage lives in
[chart-sizing.spec.ts](../tests/browser/chart-sizing.spec.ts).

SetCollector MDX entries stay inline in paragraphs and lists. Recognized sports
use labeled emojis before the linked set name; other categories retain text. Counts and formatted percentages
come from the selected summary snapshot. The compact completion bar uses the raw
owned/total ratio clamped to 0–100, with a solid HSL hue interpolated from red
through orange, yellow and yellow-green to green. Its scale and neutral track use
`--collector-progress-*` tokens in `app/globals.css`. Missing snapshots or invalid
progress omit the counts and bar; only actual completion earns 💯.

## Frontend facelift

The WU-1000 rollout follows the [design contract](facelift/design.md) and
[route/capability inventory](facelift/routes.md). WU-1288 owns the design fixture;
rollout stories adopt the shared patterns in sequence without changing domain
semantics or expanding write permissions.

Shared directory state lives in `lib/directory-state.ts` and
`components/directory/useDirectoryField.ts`. Use one field hook for each supported
public query key, with an explicit default and allowed enum/page-size values.
Search replaces history; other changes push history and reset page. Read from
`window.location` only in the external-store snapshot and event handlers so SSR
and initial hydration agree. Clamp the displayed page before slicing rows.
Server-paged directories retain their server queries instead of adopting a
client full-dataset load. Keep private edit drafts in local React state.

`DirectoryReturnLink` validates `returnTo` against its exact directory path and
keeps only supported public query keys. `withDirectoryReturn` adds that public
context to local detail links. Canonicals continue to use the route path.
`PageSections` composes optional section navigation with caller-owned content;
`PageIntro` accepts a persona eyebrow; `PageState compact` uses h2 for an inline
state below the page's existing h1. Existing defaults remain unchanged.

Database-free browser coverage runs with
`PLAYWRIGHT_CHROME_PATH=/usr/bin/chromium npx playwright test --config playwright.facelift.config.ts`.
It covers real native history, reload, invalid queries, page-size changes, no
matches and responsive layouts without environment files, seeding or app startup.
It does not establish live Next/database integration.

The Homies pilot keeps all directory subjects and card-count ordering, with name
and rank alternatives (missing values last). Search includes aliases; trend,
sort and paging persist in the URL. Cards and tables show measurement dates and
explicit unavailable values. Profiles use wrapping grid headers, safe directory
return links and section anchors. Alias redirects retain validated return state;
canonical metadata and missing-ranking detail behavior remain unchanged. Existing
snapshot/edit validation, permissions, conflict preservation and feedback remain.

Clans retain server pagination. The reader whitelists cards/name/rank SQL ordering
and uses stable clan/sport tie-breakers; the cache key includes sort. A stale page
past the final result page is reread at the last valid page. Explicit search,
filter, sort and page actions push Next history, preserving Back/Forward. The
client displays the supplied server order and carries safe directory context to
profiles. Each sport retains its own dated metrics/history and profile anchor;
no member/collection counts are combined into a new distinct-card metric.
