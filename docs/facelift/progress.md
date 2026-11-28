# Facelift execution evidence

Branch: `epic/WU-1000-frontend-facelift`. No merge or deployment performed.

## WU-1288

Completed design/inventory on November 28, 2026. All 74 page entry points are
mapped in routes.md; design.md specifies shared and optional capabilities,
URL/history/return behavior, accessibility, state distinctions and preserved
content/domain semantics. preview.tsx and render-preview.mjs produce six design
examples at 375px/1440px without app or database access. Twelve captures passed
overflow checks; mobile directory, custom Fam, desktop clan and Set Collector
were visually inspected. These are design fixtures, not connected route tests.

`SKIP_DB=true NEXT_TELEMETRY_DISABLED=1 npm run verify:agent` passed in 131.7s:
268 Jest suites and 2,135 tests passed; two opt-in suites/six tests skipped.
Coverage: 88.63% statements, 81.90% branches, 86.79% functions, 90.06% lines.
Database-free Next production build passed. Documentation, explicit Prettier,
changed fixture ESLint and diff checks passed. Runtime Node was 24.22.3; hosted
CI still owns the repository-pinned Node check. Database-writing suites were
not run. Generated next-env.d.ts build-path churn was restored.

## Jira field audit

WU-1000 and WU-1288 through WU-1299 were updated and read back: active sprint
run 64 (800), current unreleased fix version 14847 (shaolin 2.7.63), relevant
existing persona/platform components, and one Story Point per child following
recent WU-1117 story usage. Existing James assignee/reporter, Medium priority,
labels, hierarchy and native dependency links were retained. Start date records
actual work for the epic and WU-1288; later stories receive it when started.
No due date or team was invented; comparable recent work leaves those empty.

## WU-1289

Shared query parsing/serialization, page clamping, hydration-safe native-history
field hooks and validated directory-return links are implemented. PageIntro gains
an optional eyebrow; PageSections composes section navigation; compact PageState
uses h2 without changing existing full-page defaults. No data/API changes.

The full baseline passed with 269 suites/2,138 tests, the same passing coverage
thresholds, and a database-free production build. Four database-free Chromium
checks passed for reload/history/search/sort/page-size/reset and responsive
375px/768px/1440px layouts. Unit checks cover malformed paging/enums, preserved
unrelated parameters and hostile/private return destinations. The mobile fixture
was inspected; UTF-8 metadata was added to the isolated screenshot harness after
spotting an encoding artifact, and browser checks passed again. Screenshot
outputs live under test-results/facelift-*/. No connected write checks ran.

## WU-1290

Homies now persist alias search, trend, sort and paging, clamp stale pages and
carry validated return context through detail/alias navigation. Cards and tables
show measurement dates; absent values remain distinct from zero. Card-count
ordering remains the default, with stable name/rank alternatives. The pilot
corrected the initial inventory's mistaken jersey-order note after inspecting
the reader's actual ORDER BY. Profile headers wrap long names, and section links
organize history, relationships, names and Chronicles without changing feeds.
Snapshot close targets/action spacing improved; existing authorization and editing
remain intact.

Full verify:agent passed in 115.7s: 269 suites/2,142 tests, unchanged passing
coverage and database-free build. The subsequently added alias-return regression
passed in the focused 13-test route suite. Six Chromium checks passed, including
mobile/desktop alias-search -> profile -> same-state directory journeys; pilot
screenshots under test-results were inspected. Mocked 409/403/422 responses retain
edited input, alongside existing save/failure/unsaved-edit tests. No database
writes or connected authentication checks ran.

## WU-1291

Clans use server-backed cards/name/rank sorting with stable ties, a sort-specific
cache key and stale-page recovery. The client preserves server order and pushes
explicit query changes into browser history. Directory names and detail links
carry safe return state; rows/cards show measurement dates. Group profiles retain
sport-specific snapshots and metrics, add section anchors and explain missing
members/history. Membership and motivation feeds remain separate.

Full baseline passed in 112.7s: 269 suites/2,148 tests, passing coverage and
production build. Focused mocked checks cover sorting before pagination, stale
server pages, filters, existing scoreboard semantics and group/detail rendering.
Eight Chromium checks passed, including Clan filter/sort -> multi-sport profile
-> same-state directory and Back at 375px/1440px. Mobile profile capture inspected.
Server query navigation is a fixture adapter; live database/Next integration is
not claimed. No SQL mutation or deployment occurred.

## WU-1292

Fam/Squads use searchable, alias-aware directories with name sorting, bounded
pagination and safe return state. Canonical alias redirects retain public
directory state. Generic profiles separate memberships, collections and
Chronicles; the existing feed readers and distinct family/athlete identities
remain unchanged. Bonnibel/Jeff retain authored text, images, Reddit/document
URLs and activities in the common shell with explicit story/collection/feed
sections. Singular squad and legacy member URLs retain their existing behavior;
the curated landing links to both canonical directories. Volleyball supports
URL search/sort/page state and detail returns, retaining dates, records and
unknown finishes.

Twelve isolated Chromium checks passed, including Fam alias search/pagination,
long names/document frames, volleyball search/sort and detail returns at
375px/1440px. Representative Fam mobile and volleyball desktop captures were
inspected. These fixtures do not claim live third-party embed availability or
a connected Next/database integration. Focused mocked tests (24) passed,
including family feed isolation, disabled tag links and safe alias redirects.

Full baseline passed in 132.7s: 269 suites/2,149 tests, passing thresholds and
production build. Format, docs and server self-fetch checks passed. Separate
metadata lint reports 14 pre-existing missing declarations (including generic
identity routes); copy lint reports the existing FirstOffTheLineSection em dash.
These are recorded for the final integration sweep, not attributed to this story.
Database-writing suites, connected authentication and deployment remain unrun.

## WU-1293

Music Homies/Clans opt into alias-aware searchable identity directories. Music
profiles show canonical artist appearances and memberships without card snapshot
modules. Crates keeps the original aggregation/fallback semantics, adds public
query/search/type/sort/page controls and dated cards with canonical artist links.
Unclassified tags remain discoverable. Source Chronicles and tag archives offer
a safe Crates return; archive alias redirects preserve it. Dedicated music pages
retain authored prose, albums and YouTube media in the common shell.

Fourteen isolated browser checks passed, including music filtering, unclassified
artist keyboard navigation, source/artist returns, no-match state and responsive
bounds at 375px/1440px. Mobile Crates capture inspected. Focused mocked checks
verify canonical artist aliases, source/fallback titles and draft exclusion.
No external music service, live media fetch or database write was introduced.

Full verify:agent passed: 270 suites/2,150 tests with thresholds met and the
production build completed. Docs and formatting passed. The known metadata/copy
lint findings from WU-1292 remain assigned to the final sweep. Connected media,
authentication and database-writing integration checks remain unrun.

## WU-1294

Category and SetCollector directories now use URL-backed search, domain-specific
sorting, pagination and safe detail returns. Default ordering and clean canonical
links remain intact. Category profiles add anchors to counts/ranks/dated history;
set profiles gain a real page heading and history/photo navigation. Shared
collection details inherit safe return state while retaining persona themes.
Set progress calculation, selected inline snapshot behavior, ratings, trade links,
category authorization and snapshot API/form contracts remain unchanged.

The separate database-free chart suite passed all 16 checks, covering chart
measurement, exact tooltip values, ranking gaps and responsive snapshot
entry/correction with intercepted API responses. The full baseline includes
existing inline SetCollector zero/partial/complete progress and date selection
regressions. No category total is synthesized from overlapping collections.

Full baseline passed in 128.2s: 270 suites/2,150 tests, coverage thresholds and
production build. Eighteen browse fixture checks passed. Category desktop and
SetCollector mobile captures were inspected; the latter prompted a compact
two-column mobile summary, which passed the focused mobile/desktop browser
journey again. Fixture types, docs and formatting checked separately. Connected
SQL/authentication tests remain unrun under the read-only boundary.

## WU-1295

All six tracker families use shared URL/pagination/return behavior: LCS, USPS,
Bricks, Call A Save Point, Golden Age and Table Schema. Existing state/rating/
visit sorting remains; Bricks adds name/rating/session sorting while retaining
its source default order. The new shared pagination hook owns only paging and
safe detail links; domain fields and calculations remain with each tracker.
Route configs now describe browsing and original stories rather than storage or
MDX implementation. Detail layouts link to the dated feed; feed chronology,
original MDX compilation, source links and media remain unchanged. Review
subjects with no external URL render plain text.

Thirty isolated browser checks passed, covering all six configurations at
375px/1440px with search/sort/page reset/detail return and responsive bounds.
LCS and game-review mobile captures inspected. Thirteen focused mock tests passed
for controls, detail metrics and original Chronicle rendering. Heading queries
were made explicit where a new timeline anchor shares the heading's text.
No tracker route was omitted and no backend feature or SQL work was added.

Full baseline passed in 129.1s: 270 suites/2,150 tests and production build with
passing coverage. Docs/format checks passed. Existing shared loading, error with
retry and not-found boundaries remain in use. Connected database/authentication
and external media integration remain unrun; all fixtures used synthetic data.

## WU-1296

Trades and partners now retain URL search/filter/sort/page state and safe returns.
Received-only/completed classification and quantities remain owned by existing
readers. The Hall of Fame scoreboard stays unchanged; a public view selector
switches between partner rankings and exact set inductions, each searchable,
sortable and pageable. Default partner induction ranking and induction chronology
are preserved. Induction links carry Hall of Fame state to partner/trade/set
pages. Trade detail gains a semantic heading, compact mobile stats and timeline
navigation; partner relationships still use their existing canonical links.
Singular compatibility routes retain allowlisted public browse state and reject
external returns. No import/status/induction mutation capability was added.

Thirty-five focused mocked checks passed for trade classifications, partner
relationships, Hall of Fame tables and original timeline content. Two additional
compatibility regressions passed for query filtering and safe redirects. The
Hall of Fame route regression now exercises the view selector and unchanged
scoreboard instead of expecting both tables to be visible simultaneously.

All 34 browse checks passed, including trade-to-partner returns, partner
recognition filters and Hall of Fame view reload/set returns at both sizes.
Mobile captures exposed missing quantity fields and an incorrect "Open" fallback
for completed trades without an end date. Cards now show received/sent/total with
unknown values preserved; missing completion dates say "Not recorded". A focused
regression covers this distinction, and all four trade/Hall of Fame browser
journeys passed again. Filtered Hall of Fame emptiness has a distinct message.

Final baseline passed in 142.5s: 271 suites/2,153 tests, passing coverage and
production build. Docs and formatting passed. No connected database mutation,
authentication, import or deployment was run.

## WU-1297

Chronicle and tag archives now retain search, sort, page and page size in public
URLs. Tag pills retain authored labels, metadata-disabled/external behavior and
canonical routing; explicitly labeled archive links remain separate from related
identity destinations. Public archive returns survive alias redirects and details.
Scroll paging creates history entries and detail links carry validated search and
sort state. The existing server paging, SQL ordering and creation gates are intact.

Persona release logs add GET search over existing extracted titles, tags and
release text. Search is applied before the existing ordering/pagination and keeps
source objects, MDX, original source anchors, colors and dates. Canonical metadata,
invalid-page behavior, per-persona extraction and article bodies remain unchanged.
The shared page shell recognizes only supported archive return destinations.

Four isolated browser journeys passed at 375px/1440px, covering archive search,
page reset/reload, tag and Fam return paths, scroll GET controls and detail return.
Mobile archive and desktop scroll screenshots were inspected. Focused regressions
cover canonical/disabled links, existing tag counts, safe returns, release search
and original source-section anchors. These checks use synthetic data and mocked
services; connected databases, authentication and release creation remain unrun.

Full baseline passed in 153.8s: 272 suites/2,162 tests, passing coverage and
database-free production build. Docs and formatting checks passed.

## WU-1298

All five persona pages now share an introduction and application discovery module
backed by the existing request-cached, permission-filtered menu. Database labels,
ordering, external targets and feature visibility are retained. Authored sections,
media, activity charts and release feeds remain intact. Home and site search use
the shared heading contract; Mark2's authored blueprint heading becomes h2 beneath
its new page h1. The route-to-menu reconciliation is recorded in `docs/menu.md`.
No new navigation SQL or global stylesheet change was needed.

All 38 Vitest checks passed, including actual menu loader fixtures for anonymous
and authorized Admin discovery, external links, public route coverage, mobile
and desktop discovery, command search and feature/requirements precedence.

Both isolated navigation journeys passed at 375px/1440px. Screenshots were
inspected. They cover landing-to-Homies navigation, mobile dismissal, desktop
Escape/focus return and command discovery of both Homies directories. The browser
exposed a desktop closing-animation focus race; dismissal now preserves a newly
selected control or command input. The regression passes with rapid menu-to-search
interaction. Vitest's full 38 checks passed again after that fix.

Final navigation baseline passed in 124.8s: 272 suites/2,162 tests, passing
coverage and database-free production build. Docs and formatting passed.

## WU-1299

Final reconciliation accounts for all 74 page routes with an owner and explicit
migrated/intentional-exception outcome. Canonical metadata was added where routes
previously inherited generic metadata; typed/re-exported declarations no longer
trigger false scanner failures. Identity metadata preserves authored names/previews
and canonical aliases, sharing one request-local lookup with profile/music content.
Alias redirects now preserve archive return state. Malformed archive paths are
rejected. The unused pre-rollout identity-card branch was removed after confirming
all four callers use the new directory. The existing prohibited punctuation in
First Off the Line was corrected without changing its meaning.

All 44 isolated browse/navigation/visual/reflow checks, 16 chart/editor fixtures
and 38 Vitest checks passed. Before/after component screenshots are committed in
`evidence/`, with their scope and reproduction method in `verification.md`.
Metadata, copy, server-fetch, docs and explicit formatting checks passed. Final
baseline: 112.3s, 274 suites/2,168 tests, passing coverage and production build.
No new SQL or database-writing validation was needed or run.

The extra local production probe was blocked by missing runtime auth/database
configuration and returned 500 error boundaries. It is not counted as hydration
or rendered-SEO evidence. Connected-runtime validation, real authentication and
owner-operated mutation checks remain pending. Code preparation, merge and
production deployment are separate states; no deployment was initiated.
