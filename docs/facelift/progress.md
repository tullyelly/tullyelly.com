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
