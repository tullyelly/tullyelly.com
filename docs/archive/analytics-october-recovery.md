# Historical October 2026 analytics record

Archived on 2026-10-29. This preserves dated claims, test results and superseded
instructions; it is not an operating procedure or current readiness evidence.
Use [current operations](../analytics-rollout.md) and
[current DataGrip procedure](../analytics-neon-setup.md). Branch IDs and credentials
mentioned here must never be reused without fresh verification.

# Vercel analytics archive rollout

Phases 1–3 are implemented on `cipher/analytics-archive`. The updated mission
supersedes the former manual production SQL/deployment procedure. Cipher now
prepares and executes an exact release through the protected GitHub workflow
after human approval. No production release is approved or dispatched.

The current preparation, live evidence and blockers are recorded below. The
[approved release policy](../production-releases.md) governs production operations.
The old human-operated checklist later in this file is retained as historical
context, not executable production instructions.

## Recovery and current inventory; October 10, 2026

| State                                     | Evidence                                                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implemented and fixture-verified          | Daily archive/client, bounded catch-up/import, owner actions, cron, public allowlist/counters/stats; original commit `6fa00dfd`                                   |
| Implemented and live database-verified    | Original 076/077 applied only to isolated dev/analytics; real transaction, overlap and durable resume tests                                                       |
| Implemented and live API-verified in part | Existing CLI authentication queries October 9 UTC: sitewide 16 views/9 daily visitors; seven exact paths total 16 views, no Others                                |
| Implemented but not fully verified        | Protected workflow, executor and staging/promotion automation; account-level gate, authenticated browser transport, scheduler and Sentry delivery remain pending  |
| Incomplete                                | Per-file historical ledger reconciliation, backup restore rehearsal, credential rotation, account gate setup, distinct release dispatcher, final release manifest |
| Superseded                                | Human executing routine production SQL/deployment in DataGrip; install instructions as proof of MCP access; earlier unknown local development target              |

Recovery checked the local branch/history and working tree, existing PR search,
GitHub main/rules, Neon metadata and catalog, Vercel project/deployment metadata
and environment names. No analytics PR exists. Remote main and currently
promoted Vercel production both use `b4e709b8e3b4ff702701c1f944c35bd4c6a0572b`,
deployment `dpl_8QvjywHnuwjjnE4Tvt1DLm6MyATa`; its cron definitions are empty.
Production and development have no analytics tables or migration ledger. There
is no evidence of an earlier partial analytics deployment/migration; all
production checks in this recovery were read-only.

Verified capabilities and targets:

- Neon MCP authenticated; project `rough-bush-94516855`, PG17, aws-us-east-2.
- Production `br-withered-snow-aea0yck6`, direct host
  `ep-jolly-flower-ae4bmy06 + DNS suffix below`.
- Existing development `br-crimson-fog-ae22ws22`, direct host
  `ep-flat-cherry-aepuz1d0 + DNS suffix below`; this matches .env.local.
- Newly created isolated `dev/analytics`, `br-raspy-bonus-aec1uxdu`, parent
  development, direct `ep-calm-recipe-aezrlhqg + DNS suffix below`,
  database `tullyelly_db`, role `tullyelly_admin`, 0.25 CU, five-minute suspension.
- Ignored `.env.analytics-test.local` created with mode 0600 using only the test
  branch credentials; existing environment files and Vercel connections unchanged.
  The existing preflight verified SQL identity and read-only state before writes.
- Vercel CLI63.1.2 authenticated as `tullyelly`, project
  `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team `team_pB5TcLa7apLtPAiVrRbcjBG3`.
  MCP project listing works, but scoped inspection returned 403; CLI fallback
  succeeded. MCP/CLI/Actions credentials are separate; Actions access unverified.
- GitHub MCP repository access includes admin/push. Local SSH Git authentication
  fails; no remote branch/PR mutation was performed. Main is protected by a
  ruleset, but currently requires zero approvals and no required CI checks.

Read-only catalog assessment confirmed historical domain schema and analytics
migration prerequisites already exist, including admin app/role and
`authz_bump_revision(uuid)`. Both analytics migrations' effects were genuinely
absent before the isolated rehearsal. Historical 001–075 remain unrecorded;
existing objects are evidence of schema effects, not proof of all seed/backfill
or destructive migration execution. No historical files were replayed and no
baseline ledger records were fabricated. Production reconciliation requires a
separate reviewed release, not the analytics executor's apply step.

The isolated rehearsal applied original SQL files 076/077 after exact checksum,
identity, absence and prerequisite checks. Its ledger intentionally remains
absent. This validates new schema on the historical database shape; it does not
validate or reconcile historical production migration history.

Independent specialist review found and resolved chart precision labeling,
pooled-connection session lock safety, complete release-code binding, preview
database proof and staged collection disablement concerns. Large verified BIGINT
counts remain exact in tables; charts now explain values they cannot plot safely.
The collector refuses Neon pooler URLs before database/API work. The release
workflow must also verify schema readiness beyond ledger status.

Live API evidence used existing CLI credentials and read-only requests; the
separately configured `ANALYTICS_VERCEL_TOKEN` collector credential remains
unconfigured. Small-day aggregate compatibility is proven. A second live verification forced
limit=1 and completed seven bounded exclusion queries through the Others bucket,
enumerating all seven unique paths and reconciling 16 views. Very large filter
limits, retention boundaries and collector token transport remain unverified.

Automatic approval review rejected access to decrypted production environment
credentials, even a single DATABASE_URL target inspection. Non-decrypted names
were inspected instead; the user subsequently confirmed production hostname/database/role. The reply accidentally included a password; it was not recorded or used and
requires secure rotation before release. There are no configured
analytics environment names yet, and DATABASE_URL is production-only; preview
isolation is not established. Live setting changes await a concrete approved plan.

Neon reports 24-hour history retention and no scheduled snapshots. No recovery
snapshot or restore rehearsal was performed; the project snapshot list is empty. Vercel Git deployment creation is
enabled, production branch main, and its ignore command allows production builds;
merging can currently bypass the future gate. The proposed separate account
change is to disconnect Git deployment integration, then use explicit isolated
previews. The workflow refuses a connected Git link and does not change it.

New release files: `.github/workflows/production-release.yml`,
`.github/CODEOWNERS`, `scripts/production-release.ts`, `scripts/release/manifest.ts`,
`scripts/release-db.ts`, `scripts/release-db-core.ts`, release fixture/integration
tests and `docs/production-releases.md`. No new SQL migration or changed migration
history is introduced by the release automation. See the release policy for
exact environment/secrets names, approval action, execution, stop points and
application rollback versus database recovery.

## API decisions verified October 10, 2026

Official sources:

- [Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api)
- [Aggregate visits](https://vercel.com/docs/rest-api/web-analytics/aggregates-page-views)
- [Count visits](https://vercel.com/docs/rest-api/web-analytics/counts-page-views)

Aggregates are restricted to the plan reporting window. Count queries expose
production totals since analytics activation; phase 1 does not retain lifetime
snapshots. Never add these counts to overlapping daily totals. Daily visitors
represent visitors within each day; their sum is not distinct lifetime people.
Sitewide visitors are queried separately and never summed from page visitors.

The aggregate API documents inclusive bounds, production as the default filter,
exact requestPath without query parameters, a default grouped limit of 10,
OData `ne` and `and`, and an Others bucket. It documents no pagination cursor,
maximum limit, maximum filter length, retention metadata, or definitive empty-day
semantics. The REST response example omits metrics, while the narrative examples
show numeric pageviews and visitors; runtime validation requires those metrics.
Unknown response versions fail closed. Live API compatibility remains unverified.

The client explicitly filters production, requests one UTC day with inclusive
00:00:00.000 to 23:59:59.999 bounds, and requests 100 paths at a time. If Others
appears, subsequent requests exclude every already staged exact path. A day is
published only after no Others remains and page views reconcile with a separate
sitewide daily aggregate. Duplicate paths, invalid paths, mismatched totals,
unknown daily buckets and malformed responses cannot establish completion.
Exclusion filters stop at 24,000 URL characters; provider limits may be lower.
If the provider rejects these queries or very large days cannot be enumerated,
coverage remains incomplete. A different source or partition strategy is required
before those days can be used for complete counters. This service never pretends
a top-path report provides complete coverage.

Empty daily responses are incomplete, not zero. Only explicit zero metrics plus
complete enumeration establish verified zero traffic. `availableFrom` must be
an operator-confirmed earliest fully available UTC day, accounting for activation
and the plan retention window; it is not inferred from empty responses. Earlier
days are marked unavailable. Set this conservatively; partial retention days
must be excluded. Reassess it as the reporting window moves. Older unavailable days require an explicit cursor reset on a confirmed safe
target to revisit them with corrected bounds; API failures do not move the cursor.

## Schema and runtime

Forward-only migration `076_create_analytics_archive.sql` creates:

| Table                   | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| dojo.analytics_day      | Project/day sitewide totals and verified coverage status        |
| dojo.analytics_page_day | Exact path/day replacement summaries                            |
| dojo.analytics_stage    | Durable partial enumeration, never public totals                |
| dojo.analytics_progress | Independent daily and backfill cursors                          |
| dojo.analytics_run      | Running, interrupted, failed, bounded and completed invocations |

No raw visitor identifiers or browsing histories are stored. Counts use BIGINT;
API numeric counts must fit safe JavaScript integers. A dedicated connection holds
one project-scoped session advisory lock across both lanes. A competing invocation
returns overlap without writing or calling Vercel. A new lock owner marks stale
running records interrupted. Each staging batch commits independently. Replacement,
verified totals, staging cleanup and cursor advancement commit together. Failed
refreshes preserve previous verified summaries; consult the latest run status to
see refresh failure. Old totals remain timestamped with their last verification.

The collector entry point is `lib/analytics-archive/collector.ts`, server-only.
`collectAnalytics` requires lane, startDay and availableFrom; optional maxDays
(default 7, range 1-31), maxRequests (default 20, range 2-100), and a clock for
fixtures bound each invocation. Each API query has a ten-second timeout and up
to three attempts for network failures, 429 and 5xx, with bounded backoff. Stored
errors are controlled codes; returned errors omit tokens, URLs, response bodies
and database details. Retries count as one logical query; the physical upper
bound is three times maxRequests. Build-time collection is blocked before pool
creation. The existing pool guards remain intact.

Daily refresh prioritizes the previous three completed UTC days, then catches up
from its durable cursor. Daily invocations require at least four day slots and eight logical requests.
The request budget is divided across selected days so a truncated recent day
does not consume the entire invocation before catch-up can run. Backfill only advances its own cursor; invoke it independently
with a historical start date and budget. If bounds are exhausted, partial staging
survives and the same day resumes using path exclusions. The current day is never
queried. Persisted start cursors are not silently reset by later startDay inputs.
Counts can change during enumeration; mismatches discard staging for a fresh
retry. Vercel provides no immutable query snapshot; equal totals are the available
reconciliation evidence, not proof that the upstream dataset never changed.

Configuration, read only when constructing the API client:

- ANALYTICS_VERCEL_TOKEN: server secret with project analytics access.
- ANALYTICS_PROJECT_ID: stable Vercel project ID.
- ANALYTICS_TEAM_ID: team ID for team-owned projects; omit for personal projects.

Do not put these values in NEXT_PUBLIC variables. No shared data cache is introduced. Phase 3 must define public read semantics,
unavailable coverage labels and cache invalidation before public counters use
this archive. Phase 2 authorization, scheduling and observability are described
below. SQL migrations use the existing ledger and
must be separately reviewed and applied to a confirmed non-production target.
Never invoke collection or migrations during builds.

## Phase 1 verification evidence

Focused Jest fixtures cover UTC/leap-day boundaries, production filtering,
exclusion escaping, duplicates, Others, malformed metrics, bounded retries,
overlap, partial staging/resume, replacement, transactional completion ordering,
API failures, ambiguous empty data, explicit zero and unavailable history.
These use a stateful connection fixture, not a PostgreSQL engine. Static migration
checks do not establish SQL execution, advisory-lock behavior on a real pool,
rollback atomicity or production application. Live Vercel requests are not made.

Verification in this checkout:

- `npm run verify:agent`: preparation, lint, TypeScript, Prisma generation and
  188 Jest suites / 917 tests passed. Coverage: 88.06% statements, 80.99%
  branches, 86.79% functions and 89.74% lines; all thresholds passed. The final baseline passed in 70.5 seconds, including the Next production build
  (26.2 seconds), after rerunning outside the sandbox. The earlier sandboxed
  build stalled and was interrupted; it is not counted as a pass.
- Final collector suite: 14 tests passed in the full baseline, including rollback ordering, request
  timeout aborts, total reconciliation, the build guard and fair daily/catch-up request allocation. Final changed-file
  ESLint and TypeScript checks passed after the error-redaction adjustment.
- `npm run docs:check`, explicit changed-file Prettier check and
  `git diff --check` passed. `npm run format:check` selected no committed files;
  the explicit check covers these working-tree changes instead.
- `npm run guard:self-fetch` passed with sandbox escalation for tsx's local IPC
  socket. No application or dev server was started.
- `npm run check:emdash` reports existing violations in
  `app/cardattack/homies/_components/HomieDirectory.tsx` and
  `components/FirstOffTheLineSection.tsx`; neither file was changed.
- `.env.test` contains a remote target without a clearly non-production host or
  database name. It was not connected to. A disposable local database attempt
  found PostgreSQL client tools only; initdb and pg_ctl server binaries are absent.
  No database server was started and no SQL was executed. The rollback SQL fixture
  is `db/tests/076_analytics_archive_test.sql`; run it only after migration 076
  on a confirmed disposable non-production target. Real SQL constraints, migration
  syntax, transaction rollback and two-connection lock tests remain pending.

No production database was accessed. Browser/SEO/Vitest checks did not apply to
phase 1, which had no route, component or metadata changes.

## Phase 2 operations

Administration URL: **https://tullyelly.com/mark2/admin/analytics**.
Local smoke URL: **http://localhost:3000/mark2/admin/analytics** (use your local
port if different). This is an uncached Node.js page with noindex metadata. The
page and every server action enforce the existing session's `owner` role plus
`must(actor, 'admin.analytics.manage', { strict: true })`. The owner role follows
the existing OWNER_DOMAIN identity policy in auth.ts; it is not a new single-email
allowlist. An authenticated non-owner admin is still denied. Unknown, disabled,
denied, app-mismatched or stale capabilities remain denied by the existing policy
resolver. Migration 077 grants the new admin-scoped feature to the existing admin
role, assigns no memberships, and bumps/notifies affected global and admin-scoped
members in the same transaction. Existing deny grants and feature disablement are
preserved. No menu grant or menu item is added; direct access uses the URL above.

All controls submit Next server actions through forms. Next enforces POST and
Origin/Host for server actions; the actions additionally require an explicit HTTP
or HTTPS Origin matching the trusted forwarded host or Host and recheck owner
capability before any operation. They do not accept GET mutation links. Pages and
status reads use server helpers directly; no server self-fetch or authorization
cache is added.

The controls are:

1. **Test connection:** available while sync is disabled. Validate API credentials,
   read the schema catalog for expected phase 1/2 columns, and request one small
   sitewide daily aggregate for yesterday. It does not initialize the migration
   ledger, create a run or call the collector. An empty response proves API access
   only, not zero traffic or available history. Owner authorization remains required.
2. **Run now:** invoke the same daily service as cron; refresh the preceding three
   completed UTC days and allow one day of catch-up within the batch budget.
3. **Import history:** explicitly select inclusive From/Through UTC dates within
   the operator-confirmed reporting window. One request saves the range under the
   project collector lock and processes at most one bounded batch. Reposting the
   same range resumes its cursor rather than resetting it. A different range cannot
   replace a pending import; complete it first. A completed selection may be replaced
   by a different supported range. Old phase 1 cursors with no selected range must
   receive an explicit selection before Continue import can run.
4. **Continue import:** load the saved range/cursor under the same lock and process
   one bounded batch, stopping at its saved end. No client-supplied cursor and no
   post-response worker are used. If retention advances, confirmed unavailable
   days remain distinct from verified days. Daily and history progress stay separate.

Migration **077_analytics_operations.sql** adds run lane and attempted-query/
committed-day counts, plus backfill start/end/availability fields and a range
constraint on progress. Phase 1 migration 076 is unchanged. Existing run lanes
remain NULL because their provenance cannot be inferred safely. New runs identify
both lanes. Updated schema mirrors and rollback fixtures accompany the migration.
Daily completion, page replacement and cursor updates still commit atomically;
errors and time exhaustion never publish a partially written day. Failed or
incomplete days retain staging and the last verified archive where available.

### Cron and configuration

`GET /api/cron/analytics` exports nodejs, force-dynamic, revalidate=0 and
maxDuration=60. It verifies the CRON_SECRET bearer header with a constant-time
comparison before invoking the operation service. Missing/incorrect secrets get
401 JSON; no sign-in redirect, database query or API request occurs. The proxy
explicitly passes the cron path through. Every handler response includes private
no-store Cache-Control and no-store CDN/Vercel-CDN headers, including errors and
unauthorized responses.

vercel.json retains its schema and adds exactly one analytics schedule:
`17 9 * * *`, daily at **09:17 UTC**. Vercel supplies the bearer header and cron
has the function's duration limit. On Hobby, invocation may occur anywhere within
the selected hour; other plans run within the specified minute. See the verified
[Vercel cron documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
The schedule is source configuration only until a future deployment.

Additional server-only configuration:

| Variable                 | Meaning                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| ANALYTICS_SYNC_ENABLED   | Only the exact string `true` permits cron/Run now/history collection; unset or any other value is disabled                                   |
| ANALYTICS_AVAILABLE_FROM | Operator-confirmed earliest **fully** available UTC day, YYYY-MM-DD; required for writes and selection bounds; no guessed retention duration |
| CRON_SECRET              | Vercel bearer secret; use a random value of at least 16 characters; never expose it to the client                                            |

Keep ANALYTICS_VERCEL_TOKEN, ANALYTICS_PROJECT_ID and the optional team ID from
phase 1. The availability floor must be reviewed as the plan reporting window
moves. It is not proof supplied by the API; Test connection cannot discover a
retention floor or distinguish an ambiguous empty day. Supported selection ends
at yesterday UTC. A missing/invalid floor prevents writes. Configuration messages
name missing settings but never show credential values. Run records describe
collectors that acquired the lock; rejected credentials, disabled requests and
pre-collection configuration failures do not initialize run rows.

Each operation selects at most four days and eight logical API queries, with a
**35-second collection deadline**. API attempts time out after at most three
seconds and share that deadline; bounded retries remain at most three attempts per
query (at most 24 physical attempts). Budget expiration returns partial progress,
not successful day completion. Dedicated collector connections set a two-second
SQL statement timeout and one-second lock timeout, then are destroyed on release
so session settings/locks cannot contaminate pooled requests. Shared pool acquisition
now times out after five seconds. Requests reserve the remaining function time
for rollback, run status, response and up to two seconds of error-reporter flush.
The 60-second configured limit is below current Fluid Compute limits on all plans;
confirm the effective project/runtime limit before future deployment. See
[Vercel duration configuration](https://vercel.com/docs/functions/configuring-functions/duration).
A platform kill or lost connection can leave a running run record; the next lock
owner marks it interrupted, and committed staging remains resumable.

Results are explicit: `success` (HTTP 200), `partial` (HTTP 202, budget/cursor work
remaining or another collector owns the lock), `disabled` (HTTP 200 without any
collection writes), and `failure` (HTTP 500 from cron, readable result in actions).
Authentication failures are HTTP 401. The disabled gate runs before collector
construction, range writes or run creation; owner authorization reads may still
occur for administration. The connection test is intentionally read-only even
when collection is enabled. Invalid range selection does not call the collector.

### Freshness, errors and notifications

The admin page shows last attempt, last completed run in either lane, last
successful daily run, latest verified/zero archive date, daily cursor/pending work,
saved import range and verified/unavailable/incomplete/API-failed/unattempted day
counts. The latest archive date is not a contiguous coverage claim. Daily freshness
uses only completed **daily** runs, becoming stale after 36 hours without one;
recent backfill success does not hide daily staleness. Legacy NULL-lane runs do
not establish daily freshness. History gaps and terminal unavailable days are
shown separately from daily freshness and verified zero traffic.

Execution failures emit controlled error codes to console and the existing
Sentry configuration (initialized for cron as well as page actions), with a bounded
flush before response. Raw upstream bodies, headers, form values, database errors
and credentials are not supplied to the reporter. Reporting depends on the
existing DSN/disable settings and delivery is not guaranteed. Configured external
Sentry transport was not exercised in this workspace.

**Missing-run notifications do not exist in phase 2.** Neither the stale badge nor
run records send an external alert when cron never runs. An external heartbeat /
Sentry Cron Monitor or equivalent alert policy is an optional operational
follow-up; do not mistake execution error reporting for missing-run detection.

## Non-production setup handoff and smoke test

No suitable database is currently confirmed. The existing .env.test target was
rechecked on October 10, 2026 and classified as remote without an explicitly non-production database or
host, and was not connected to. PostgreSQL server binaries are absent here; client
utilities alone cannot create a disposable instance. Do not substitute production.

1. Create a manual Neon **dev/analytics** branch and separate DataGrip connection
   following [the setup guide](../analytics-neon-setup.md). Keep its inherited
   tullyelly_db and tullyelly_admin names. Match project/branch/endpoint metadata;
   a name alone does not establish non-production safety. Do not change Vercel
   connections or automatically provision previews.
2. Populate the ignored **.env.analytics-test.local** with both matching test URLs
   and the exact non-secret target metadata listed in the guide. Leave existing
   .env.local/.env.test unchanged. API/owner browser testing additionally needs
   securely configured test Vercel and local NextAuth/Google settings. Keep
   ANALYTICS_SYNC_ENABLED=false initially. Next does not automatically load this
   special env file; the user controls the local app process.
3. Run the guide's metadata-only check, then its explicit read-only schema/ledger
   preflight on the confirmed test branch. Manually executed migrations may not
   be recorded. Review unrecorded files individually, distinguish missing schema
   from existing/ambiguous effects, and reconcile only reviewed changes on that
   isolated branch. Do not initialize a ledger through status or apply every
   pending migration as an initial assessment. Only after reconciliation and
   explicit schema preparation should the integration suite run. The existing
   runner is appropriate only if all older history is reviewed and exactly
   076/077 remain pending, with no failed/drift state. The guide keeps DataGrip
   inspection and reviewed manual SQL bundles in the workflow.

4. Ensure the test account satisfies the existing OWNER_DOMAIN policy and has an
   existing admin membership on the admin app (or a deliberate global admin grant).
   Use the existing guarded membership workflow if a test membership is needed;
   do not hand-write grants without revision bumps. Test anonymous access, a
   non-owner authenticated account and an owner without the analytics capability;
   none may read status or invoke actions. Valid owner access should open the exact
   local administration URL above.
5. With collection disabled, Test connection should check the schema and a small
   API read successfully. Missing/wrong cron credentials should return 401 without
   changing run/progress/summary rows. An authenticated cron call should return
   disabled and leave those tables unchanged:

   ```bash
   curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/analytics
   ```

   Export the test CRON_SECRET in the curl shell; Next loading .env.local does
   not export it to a separate shell. Check no-store headers on all responses. Run now and import buttons must be
   disabled; direct server-action attempts still enforce the switch and authorization.

6. Only on the disposable target, set ANALYTICS_SYNC_ENABLED=true and restart your
   local process. Run now and authenticated cron must use the same service. Launch
   two requests together to confirm one returns overlap/partial without duplicate
   increments. Verify the recent three completed UTC days; the current day must
   not appear. Compare archived sitewide totals with the separate API query.
7. Select a supported range of at least five completed days. Import history should
   process one batch, then Continue import should resume the stored next day and
   stop at the selected inclusive end. Repost the identical selection to verify
   that it does not reset progress. Attempt another range during an active import;
   it must be rejected. Check unavailable/incomplete/zero states independently.
8. Interrupt a batch and exercise an API/DB failure. Verify no incomplete day is
   published, committed staging survives and continuation retries safely. Exercise
   two real DB connections to verify the advisory lock; fixture tests model these
   contracts but are not PostgreSQL execution evidence. Confirm older/backfill
   success cannot clear a >36-hour daily stale indicator. Set sync back to false
   after smoke testing; keep all deployments and production writes out of this work.

## Phase 2 verification evidence

Completed October 10, 2026 on `cipher/analytics-archive`:

- `npm run verify:agent` passed in 73.7 seconds outside the sandbox, including
  preparation, lint, TypeScript, Prisma, full thresholded coverage and the Next
  production build (25.9 seconds). 192 Jest suites / 959 tests passed. Coverage
  was 88.06% statements, 80.99% branches, 86.79% functions and 89.74% lines.
  The related-smoke selector selected no committed source changes; the full
  Jest run included all new tests.
- Analytics Jest coverage includes cron credentials/no-store/proxy pass-through,
  unauthorized page/action access, strict owner capability checks, CSRF origins,
  disabled collection without data work, read-only readiness testing, explicit
  result mapping, duplicate overlap, repeated-range continuation, preserved
  pending ranges, inclusive end boundaries, deadline rollback and independent
  36-hour daily freshness. Admin component tests exercise disabled controls,
  form submission/results and coverage labels. The pool test verifies the
  new five-second connection-acquisition timeout.
- `npm run docs:check`, explicit Prettier checks for changed supported files,
  `git diff --check` and `npm run guard:self-fetch` passed. `format:check`
  selected no committed files; explicit checks cover working-tree files.
- `npm run lint:metadata` failed on 14 existing untouched routes (CardAttack
  set/trade routes, home and the identity routes). The new analytics page has
  complete metadata and is not listed by the checker. These existing failures
  were not suppressed or repaired as part of analytics.
- `npm run check:emdash` still reports the two existing phase 1 violations in
  HomieDirectory.tsx and FirstOffTheLineSection.tsx; neither was changed.
- `npm run test:components` was attempted but Vitest could not start any tests
  because its jsdom dependency is missing at the package resolution root. The
  new controls are covered by Jest; this is not a passing Vitest run.
- No suitable DB target was confirmed, no database was connected to, and neither
  migration nor SQL fixture was executed. Live Vercel/API, browser login, real
  server-action/CSRF transport, two-connection locking and scheduler smoke tests
  remain pending the explicit non-production setup above. Production was not
  used as a substitute. No app/dev server was started.

At the end of phase 2, nothing had been merged, deployed or activated. Phase 3
public displays and cache policy are documented below. External missing-run
notifications remain unimplemented.
The Jest tests use mocked authentication, API responses and a stateful database
fixture; they do not exercise a real database, live Vercel API, deployed scheduler,
Google login, browser server-action transport or Sentry delivery. Browser smoke
and authenticated rendered SEO remain pending the confirmed non-production setup.

## Phase 3 public display

Public statistics: **https://tullyelly.com/stats** (local `/stats`). The route was
unused. The shared footer and Chronicle counters link to it using existing link
styles; no existing content URL changed. Owner controls stay at
**https://tullyelly.com/mark2/admin/analytics** and cron stays at
`/api/cron/analytics`.

The public allowlist contains only non-draft Contentlayer Posts at their existing
`post.url`, `/shaolin` and `/stats`. This deliberately excludes other routes until
an explicit public-content contract is added. The public total is the archived
views for these currently public pages, not the unrestricted sitewide total.
No archived path is trusted to determine public visibility. Titles and ranking
links come only from the current allowlist; draft/removed pages disappear from
public summaries after deployment. Cached SQL results are keyed by project and
exact allowlist. Do not add authenticated routes by prefix matching.

Chronicle presentation receives a reusable server `PageViewCounter` using the
existing post URL. Ranking keys use Contentlayer `_id` (source-file identity).
There is no immutable editorial UUID or URL-rename history in the Post model;
renaming a source file changes that identity and old-path counts are not combined.
No redirect/alias inference or retroactive content mapping was added.

Only complete/zero days supply counts. A missing page on a fully enumerated day
has verified zero views; a missing/unavailable/incomplete day is a gap, never a
zero. The displayed range spans the first recorded day through the last recorded
completed UTC day and reports verified versus expected calendar days. This range
may contain gaps. Earlier history is not implied; nothing says all-time. Counters
show the same range. Public views exclude visitors entirely. Sitewide visitor
counts remain separately collected; daily visitors never become lifetime people.

The SQL snapshot includes aggregate totals and per-page totals across stored
history, the latest 90 calendar days as daily values, and the latest verified
archive update in UTC. Counts remain decimal bigint strings for precision; chart
values beyond JavaScript's safe integer range are omitted while the exact daily
table remains available. Recharts uses existing tokens and a 300px reserved
container. The expandable daily table provides accessible exact values and gaps.

The Next data cache refreshes after 300 seconds and is keyed by project and exact
public paths. There is no visitor-triggered Vercel API query, client polling,
background import or globally cached session. Collector writes intentionally do
not immediately invalidate this public cache; the page explains the five-minute
lag. Production builds skip analytics DB reads. Missing configuration/schema,
invalid snapshots and DB failures produce a generic unavailable state without
operational errors. A Chronicle remains readable when archive reads fail.

## Complete file inventory

New files, all three phases:

- `lib/analytics-archive/{client,collector,operations,authorization,status,public}.ts`
- `app/api/cron/analytics/route.ts`
- `app/mark2/admin/analytics/{page.tsx,Controls.tsx,actions.ts}`
- `app/stats/page.tsx`
- `components/analytics/{PageViewCounter,TrafficChart}.tsx`
- `db/migrations/076_create_analytics_archive.sql`
- `db/migrations/077_analytics_operations.sql`
- `db/schema/tables/analytics_{run,progress,day,page_day,stage}.sql`
- `db/tests/076_analytics_archive_test.sql`
- `db/tests/077_analytics_operations_test.sql`
- `__tests__/analytics-archive.test.ts`
- `__tests__/analytics-operations.test.ts`
- `__tests__/analytics-cron.test.ts`
- `__tests__/analytics-authorization.test.ts`
- `__tests__/analytics-admin.test.tsx`
- `__tests__/analytics-public.test.tsx`
- `__tests__/analytics-postgres.integration.test.ts`
- `docs/analytics-rollout.md`

Modified files: `.env.example`, `db/pool.ts`, `__tests__/db-pool.spec.ts`,
`proxy.ts`, `vercel.json`, `app/shaolin/[slug]/page.tsx`, `components/Footer.tsx`,
`tests/browser/fixtures/chart-sizing.tsx`, `tests/browser/chart-sizing.spec.ts`,
`docs/README.md`, `docs/database.md`, `docs/authz/AUTHZ-CONTRACT.md`,
`docs/caching.md`, `docs/migrations.md` and `docs/validation.md`. Phase 3 adds no migration.

## Superseded manual checklist; historical context only

**Not yet ready for production rollout.** Do the confirmed non-production smoke
first. Neon is confirmed as the provider. Production project/branch identity and the
current schema/ledger state have not been verified. Manual DataGrip migrations
may be absent from the ledger; follow [Neon setup and reconciliation](../analytics-neon-setup.md)
before any runner status/apply command. Repository URL guards expect `tullyelly_db` with
`tullyelly_admin`; that is the intended application naming, not verification of
an actual provider/branch. Before finalizing the production procedure, confirm the
Neon project/branch metadata and review the test-branch schema/ledger report. Never
send credentials. The steps below are conditional instructions for the human,
not commands executed by this agent.

Configuration names (server only; none use NEXT_PUBLIC):

| Name                     | What to enter                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------ |
| ANALYTICS_VERCEL_TOKEN   | Vercel token authorized for the selected project/team and Analytics API              |
| ANALYTICS_PROJECT_ID     | The project whose production traffic is being archived                               |
| ANALYTICS_TEAM_ID        | Owning team ID, if the project belongs to a team                                     |
| ANALYTICS_SYNC_ENABLED   | `false` initially; only exact `true` enables writes                                  |
| ANALYTICS_AVAILABLE_FROM | Operator-confirmed earliest fully available UTC day, YYYY-MM-DD                      |
| CRON_SECRET              | Strong random secret used by Vercel's cron bearer header                             |
| DATABASE_URL             | Existing application Postgres connection; keep its current safe role/database guards |

Existing owner authentication, admin membership/capability, Sentry configuration
and database settings remain prerequisites. The token must have analytics access
on the current plan. Neither a token nor an empty API response proves historical
availability; confirm the earliest _fully_ available day in the provider UI/API.

### Non-production proof before approval

Use the setup section above. A freshly empty database is not a replacement for a
restored branch with the existing authz/schema. Manual history may be unrecorded;
first complete the setup guide's read-only assessment and per-file reconciliation.
After reviewing/preparing only the required schema on that confirmed copy, run:

```bash
# Bash; test target must match confirmed Neon branch and endpoint metadata.
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=test VERCEL_ENV=development \
  DOTENV_CONFIG_PATH=.env.analytics-test.local ANALYTICS_INTEGRATION_CONFIRMED=true \
  node -r dotenv/config node_modules/jest/bin/jest.js --config jest.config.cjs \
  --runInBand __tests__/analytics-postgres.integration.test.ts
```

Expected: 3 integration tests pass, including real SQL fixtures, two-connection
advisory exclusion, persisted import cursor, repeated daily replacement and the
public SQL projection. This test uses fixture API responses; it is **not live
Vercel API verification**. It performs writes and cleanup only for uniquely named
test projects; fixtures roll back. It uses the shared test-target guard: explicit branch/host/database/role metadata,
a direct TLS endpoint distinct from production, equal DATABASE_URL/TEST_DATABASE_URL,
and a development/test environment. Confirm the provider branch
independently; names alone are not proof. Stop on readiness/TLS/auth failures.

Also perform the disabled read-only Test connection against a configured test
Vercel project, owner/non-owner browser checks, the phase 2 bounded import smoke,
and `/stats`/Chronicle unavailable, zero, incomplete and populated displays. Test
live reconciliation on a completed UTC day; the fixture API does not establish
Vercel response compatibility. Never substitute production for an unavailable test
branch. App/browser tests remain blocked until the user supplies a safe setup;
the agent does not start the dev server.

### Backup and migration checkpoint

1. Identify the exact provider project and production branch/database in the
   provider dashboard. Confirm the URL names the intended application role and
   database; do not print the full URL. Confirm a recent provider backup or
   point-in-time recovery checkpoint, its retention, and the person allowed to
   restore it. Make a disposable restore and prove it opens before production
   changes. A backup checkbox without a restore check is insufficient.
2. Export a schema/migration-ledger baseline and keep an encrypted logical backup
   or provider snapshot outside this repository. Record the checkpoint identifier
   and time privately. Use the manual Neon checkpoint/recovery-branch instructions in the setup guide;
   verify the actual plan history window and restore proof before approval.
3. Review pending migration risks on the restored copy. 076 creates five tables
   and assigns ownership to existing tullyelly_admin. It fails if tables already
   exist or that role/schema is missing; do not use DROP or IF NOT EXISTS to mask
   unledgered state. 077 alters run/progress, adds import constraints, seeds the
   admin capability by stable keys, bumps affected policy revisions and sends
   notifications. It requires existing authz tables/admin app/admin role and
   authz_bump_revision. Inspect these before approval. Older pending files include
   data changes and seeded identifiers (for example 065); never replay them blindly.
4. The existing ledger runner applies **every pending file in filename order**;
   it has no migration-selection flag. Only proceed if 001 through 075 are already
   applied with matching checksums and the only pending files are exactly 076/077.
   Stop for failed, missing, checksum_mismatch, unknown history or other pending
   migrations. Handle unrelated migration history as a separate reviewed task.
   Status/verify initialize the ledger and therefore can write; they are not
   read-only inspection tools for an unapproved production database.

After backup/restore proof and explicit human schema approval, a human can use
these **Bash** commands from the reviewed feature checkout. Place the approved
production connection in a private, ignored `.env.analytics-production.local`,
never in a command argument or committed file. Run each line separately and
inspect its output before proceeding. The flags represent an intentional human
production operation; they do not waive URL guards.

```bash
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=production VERCEL_ENV=production \
  DOTENV_CONFIG_PATH=.env.analytics-production.local npm run db:migrate:status

# ONLY when status shows exactly 076 and 077 pending, all older files applied/matching:
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=production VERCEL_ENV=production \
  DOTENV_CONFIG_PATH=.env.analytics-production.local npm run db:migrate:apply

env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=production VERCEL_ENV=production \
  DOTENV_CONFIG_PATH=.env.analytics-production.local npm run db:migrate:verify
```

Status begins `Migration ledger: dojo.schema_migration`. Apply must report
`Applied 076_create_analytics_archive.sql (... ms)` and
`Applied 077_analytics_operations.sql (... ms)`. Verify must end
`Migrations verified. All files are applied and checksums match.` Stop on any
nonzero exit, unexpected pending state, guard rejection, missing ownership/authz
prerequisite or different target. Do not manually mark failures applied or edit
checksums. Each migration has its own transaction; 076 can be committed while 077
fails. Keep collection disabled and resolve that failed migration before code
activation. These commands have **not** been executed against production.

Recovery: first disable collection and redeploy. Preserve successful archive rows
and ledger checksums. Prefer a reviewed forward SQL repair for schema problems.
If provider recovery is necessary, restore the checkpoint to a new branch/copy,
validate it and follow the provider's reviewed cutover process; restoring the whole
database can lose unrelated writes after the checkpoint. Never blindly roll back
or delete these archive tables. Final checkpoint/cutover details depend on the confirmed Neon branch metadata
and actual history window; test proof remains a release blocker.

### Deployment order

1. In Vercel Production settings, enter the analytics configuration with
   ANALYTICS_SYNC_ENABLED=false. Confirm project/team IDs, API plan, UTC reporting
   floor, owner access, current DATABASE_URL and function duration. Existing
   application behavior and Vercel Analytics collection stay intact.
2. After the non-production proof, backup checkpoint and approved ledger review,
   have the human prepare production schema using the procedure above.
3. Deploy reviewed code with collection still disabled. No build runs migrations
   or archive DB reads. The cron schedule is `17 9 * * *` (daily 09:17 UTC); verify
   the plan's scheduling accuracy and 60-second maxDuration support.
4. Sign in as an authorized owner at `/mark2/admin/analytics`, select **Test
   connection** and require success. This checks configuration/schema plus a small
   read-only Vercel query while collection remains off. Public pages may display
   unavailable until the first successful batch. Verify anonymous/non-owner access
   remains denied and cron without the bearer secret gets 401/no-store.
5. Explicitly set ANALYTICS_SYNC_ENABLED=true in Vercel Production, then redeploy
   so the new deployment receives it. Changing a dashboard variable does not
   modify an already-running deployment's environment. Use **Run now** once;
   success or readable bounded partial progress is expected. A partial result is
   not full completion; repeat a bounded request when appropriate.
6. Verify previous three completed UTC days, exclude today's unfinished day,
   confirm latest fully archived date and unchanged counts after a rerun. Open
   `/stats` and a public Chronicle after cache refresh and reconcile exact values.
7. Check Vercel cron logs and the owner **daily** last-success timestamp after
   the first scheduled run. Require the daily cursor to advance appropriately;
   backfill success alone is not evidence of scheduled freshness. Check for
   stale status after 36 hours without daily success. Execution failures go to
   configured Sentry; there is **no external missing-run notification**. Arrange
   an external monitor/reminder separately if needed; a stale badge is not an alert.

### Historical imports and count reconciliation

In the owner page, select a supported completed UTC start/end range and press
**Import history**. Each HTTP request processes at most four days/eight API
requests within the shared 35-second collector budget. Large grouped days can
require more than one batch. Press **Continue import** repeatedly; do not close
with an assumption of background work. The durable backfill cursor/range survives
interruptions. Identical selections resume; a different selection while work is
pending is rejected. Keep daily freshness and backfill gaps separate. Expand
history backward in supported bounded selections after finishing the active range;
never select data outside plan retention or infer zero from an empty response.

For reconciliation, choose one completed UTC day, same project/team and production
filter. Compare the archive sitewide daily pageviews/visitors with the separate
Vercel by-day query using inclusive 00:00:00.000Z through 23:59:59.999Z. Require
complete/zero status. Sum **all** exact-path pageviews for that day and compare
with sitewide pageviews; enumerate/exclude Others until absent. Never sum page
visitors for sitewide visitors. Then separately sum only current public allowlist
paths; this is the public daily value, and its range sum is the public total.
Private paths mean public and sitewide totals can legitimately differ. `/stats`
shows only the latest 90 days in its chart/table but its total spans all verified
stored days; account for that window before comparing. Wait for the five-minute
cache refresh. Repeat collection and require replacement, not added counts. Never
add a lifetime API count to overlapping daily records or call daily visitor sums
unique lifetime people. If totals disagree, leave the day incomplete and investigate
boundaries, retention, Others, duplicate paths and API updates before approval.

### Disablement, token rotation and backups

To pause collection, set ANALYTICS_SYNC_ENABLED=false and redeploy. All collection
entry points return disabled before writes; the scheduled authenticated request
reports disabled. An already-started batch may finish; check its run record after
redeployment. Archived data and public reads remain intact. Do not remove tables,
progress or the existing Vercel browser collection component to disable this service.

The owner must record token expiration privately and schedule renewal before it.
Create a replacement with access to the same intended project/team; update the
server-only token with collection disabled, redeploy, run Test connection, then
explicitly enable/redeploy and run a bounded recent collection. Revoke the old
token only after replacement verification. Rotate CRON_SECRET similarly and check
scheduled auth after redeployment. Treat exposed tokens as urgent rotation events;
never paste them into screenshots, documentation or PRs. Vercel's
[access token documentation](https://vercel.com/docs/accounts/access-tokens) is the
source for account-specific scope and expiration choices; no expiration is assumed
or auto-renewed by this code.

The database owner is responsible for recurring backups/PITR, restore drills,
retention/storage costs and role access. The archive preserves summaries
indefinitely but is not itself a backup. The application owner is responsible for
Vercel token renewal, scheduled-run checks and Sentry delivery/alert settings.
Agree on named people and backup/recovery details before enabling production.

## Earlier Neon/DataGrip follow-up; superseded operation approach

The provider is Neon; previous domain SQL was manually executed in DataGrip and
may not be recorded in dojo.schema_migration. No separate safe test branch or live
Vercel test configuration is yet confirmed. The new
[manual Neon setup guide](../analytics-neon-setup.md) supersedes the old assumption
that a test copy already has a complete ledger through 075. It provides the exact
ignored .env.analytics-test.local file, explicit endpoint/branch guards and
read-only catalog inspection before any ledger initialization. New operational
files are db/analytics-test-target.ts, scripts/analytics-test-preflight.ts,
db/diagnostics/analytics-schema.sql, db/diagnostics/analytics-ledger.sql,
**tests**/analytics-test-target.test.ts and docs/analytics-neon-setup.md.
Existing .env.local/.env.test and Vercel database connections remain unchanged.

## Earlier phase 3 evidence and blockers; see recovery above for current state

October 10, 2026, on cipher/analytics-archive:

- Final `npm run verify:agent` passed in 89.5 seconds, including lint, TypeScript,
  Prisma generation, thresholded coverage and the Next production build (29.3
  seconds). 194 Jest suites / 986 tests passed; one PostgreSQL integration suite
  with three tests was explicitly skipped because no target is confirmed.
  Coverage: 88.06% statements, 80.99% branches, 86.79% functions, 89.74% lines.
  The initial sandbox build was interrupted when it stalled; the final successful
  baseline ran outside the sandbox. Related smoke selected no committed changes;
  the full run included the feature tests.
- `npm run test:charts` passed all 12 real Chromium checks without an app server or
  DB. They cover the seventh chart's actual dimensions, resizing, hidden mounting,
  remounts and disconnected unknown-day gaps. The narrow archive-chart screenshot
  is in ignored test-results output. These are fixture-rendered chart checks,
  not screenshots of a deployed/locally authenticated stats route.
- Public Jest fixtures cover public source identity/allowlisting, draft/private
  suppression, query parameters/verified-day selection, generic DB failure and
  unavailable states, incomplete coverage, verified zero and bigint precision.
  Test-target fixtures cover explicit human confirmation, distinct branch/endpoint,
  production/pooler alias rejection, role/database mismatches, connection-option
  overrides, TLS and inherited URL/build/SKIP_DB guards. No test branch is inferred
  from a database name. Phase 1/2 fixture API/auth/collector tests also passed.
- Explicit Prettier checks, docs:check, git diff --check and guard:self-fetch
  passed. Metadata checking still fails on the same 14 unrelated existing routes;
  the new public/admin routes have complete metadata. Em-dash checking still fails
  on untouched HomieDirectory.tsx and FirstOffTheLineSection.tsx. Vitest was
  attempted and cannot start because the root jsdom dependency is missing; this
  is not a passing component run. No gate was suppressed to hide these results.
- No production or test database was connected to. SQL migrations/fixtures,
  two real PostgreSQL connections, real interruption/recovery and schema/ledger
  assessment are **not executed**. The opt-in integration suite is prepared,
  but skipped is not proof of success. Live Vercel API compatibility/reconciliation,
  actual owner/non-owner Google login and server-action transport, full-route
  browser/SEO checks, Sentry delivery and a deployed scheduled run remain untested.

Next prerequisite: the human creates the manual Neon dev/analytics branch and
separate DataGrip data source, securely populates .env.analytics-test.local,
confirms non-secret production/test metadata and requests read-only preflight.
Then review actual schema and manually executed migration history per file;
prepare only reviewed schema/ledger operations on that branch and execute real
integration tests. Secure test Vercel configuration is separately needed for live
API proof. Production reconciliation/bundles and backup recovery checkpoint
remain conditional until that evidence exists. Existing unrelated validation
failures also need resolution or explicit repository review; they were not waived.

The feature is ready for code review, **not ready for the manual production
rollout**. Collection defaults off. Nothing is merged, deployed or activated;
existing production/local environment files, Vercel DB connections and the
browser Analytics component are preserved. No preview branching was introduced.

## Integrated recovery verification

- `npm run verify:agent`: passed; 197 suites and 1,014 tests passed, six opt-in
  database tests skipped in the default run. Coverage: 88.06% statements,
  80.99% branches, 86.79% functions, 89.74% lines; production build passed.
- Explicit isolated PostgreSQL run: three analytics integration tests passed,
  with `--testTimeout=60000` for network round trips. An initial default five-
  second timeout was resolved by the explicit integration timeout, not hidden.
- Three additional real PostgreSQL executor tests passed using a temporary
  fixture ledger/schema: atomic completion and reruns, overlap locking, and
  failure rollback/recovery. This is not a production ledger baseline.
- Exact migrated schema readiness passed against 32 columns and 24 constraints,
  ownership, enabled owner feature and grant on the isolated branch.
- Database fixture safety: 18 tests passed; release policy/target fixtures: eight
  passed. Independent reviewer reported no remaining actionable code findings.
- `npm run test:charts`: 12 database-free Chromium checks passed; no dev server.
- `npm run docs:check`, changed-file Prettier and `git diff --check`: passed.
- Live API requests used CLI credentials; actual collector token, scheduled cron,
  Google owner browser flow, Sentry delivery, protected workflow execution and
  deployment/promotion have not been tested live.

The historical review plan is `db/diagnostics/reconciliation-plan.json`. It lists
all 73 actual pre-analytics migration files, exact checksums, observed schema
object names and data/destructive effects needing review. It is not executable
baseline SQL. New schema snapshot `scripts/release-db-schema.json` is derived
from the original SQL applied on the confirmed isolated branch. Release tests
are `__tests__/release-db.test.ts`,
`__tests__/release-db-postgres.integration.test.ts` and
`__tests__/release/production-release.test.ts`. UI fix tests are
`__tests__/analytics-traffic-chart.test.tsx`.

No final production manifest, dispatch, activation, historical import, merge or
deployment has been performed. The account-level release gate and dispatch
identity are not yet configured or verified. The smallest immediate security
action is password rotation; the next preparation dependency is a distinct
authorized release bot/App or another eligible reviewer. A GitHub MCP connection
acting as tullyelly cannot author/dispatch and also approve its own release.

## Dedicated release App preparation

The user selected a dedicated GitHub App with installation authentication;
`tullyelly` remains the human approver and Prevent self-review stays enabled.
The numbered [App setup checklist](../release-app-setup.md) specifies registration,
repository-only installation, narrowly scoped tokens, secure private key locations,
and the harmless approval test. Account configuration and live attribution remain
pending; no App token, dispatch, PR, approval or deployment was executed.

Added `.github/workflows/release-dispatch.yml`,
`.github/workflows/release-gate-smoke.yml`, `scripts/release/app.ts`,
`scripts/release/publish.ts`, `scripts/release-dispatch.ts`,
`scripts/release-gate-smoke.ts`, `scripts/release-app-publish.ts`,
`__tests__/release/github-app.test.ts`, and
`__tests__/release/app-publish.test.ts`. Production workflow and owner review
patterns now require App dispatch provenance. The dispatcher private key lives
in the separate `release-dispatch` environment, available before production
approval; production database/deployment credentials remain behind
`production-release`. App PR authorship and pushing avoid the separate
PR author/last-pusher self-review restrictions. No persistent Git authentication,
WSL, VS Code, npm or Vercel connections were changed.

### Final App integration validation

On the resumed checkout, `npm run verify:agent` passed content preparation,
lint, typechecking, Prisma generation, smoke tests and full thresholded
coverage: 199 suites and 1,038 tests passed; six opt-in database tests skipped.
Coverage remained 88.06% statements, 80.99% branches, 86.79% functions and
89.74% lines. The restricted Next build stalled and was interrupted without
a build error. The remaining build step passed separately with
`SKIP_DB=true npm run build:next` outside the restricted sandbox. Thus the
required stages passed, but the final combined invocation did not finish as
one uninterrupted run. Logs are ignored under `.cache/`.

Documentation checks passed for 42 files; changed-file Prettier and diff
whitespace checks passed. Independent review findings on Git authentication
header reset, URL rewrites, owner review patterns and the smoke mode name
were resolved. The final additional public bot identity guard is covered by
the passing fixture suite; the reviewer session ended before another final
review of that guard. Live App setup/dispatch/approval remains pending.

Neon direct hostname construction: concatenate the endpoint ID above, a dot,
and `c-2.us-east-2.aws.neon.tech`. These are non-secret endpoint identifiers;
credentials and full connection URLs are excluded.

## 2026-10-11 account audit and recreated test target

The [separate Vercel/bootstrap proposal](../vercel-bootstrap-change.md) records
verified App authentication, environment policies, main protections, current
production identity and the exact approval boundaries. No commit, push, PR,
merge, dispatch, deployment or production setting/database change occurred.
An ephemeral repository-only App token was minted and revoked for metadata reads.
Strict required status checks are off and must be enabled; the feature branch
is behind main. Prepared local CODEOWNERS keeps main's all-files ownership, and
`scripts/release-app-draft.ts` supplies the initial local App-authored draft path
before its workflow exists on main. These edits remain uncommitted for review.

The user deleted old `dev/analytics`; its prior integration evidence describes
a deleted target and does not prove the replacement has migrated schema.
Recreated branch: `br-hidden-hall-ae955q9l`, name `dev/analytics`, parent
`br-crimson-fog-ae22ws22` (development, freshly reset from production). Compute
`ep-purple-bonus-aecz6st7`, 0.25 CU and 300-second suspension. Direct hostname
is that endpoint ID plus the documented DNS suffix. Branch readiness and
read-only SQL identity passed (`tullyelly_db`); ledger and analytics tables
are absent. No SQL migrations or test writes were applied. Existing ignored
`.env.analytics-test.local` remains unchanged and refers to the deleted target;
do not run integration tests until its target/credentials are deliberately
updated and the preflight is rerun. No Vercel database connections changed.
Neon CLI performed its normal OAuth refresh during discovery; no manual CLI
authentication/configuration replacement was made.

Audit validation: the final normal-environment `npm run verify:agent` passed
all stages in 105.2 seconds, including the 36.6-second production build.
200 suites and 1,039 tests passed; six opt-in database tests were skipped.
Coverage: 88.06% statements, 80.99% branches, 86.79% functions, 89.74% lines.
The first invocation with a global `SKIP_DB=true` override failed 12 fixture
tests because that override changed their mocked database behavior; the
normal invocation passed without changing those tests or production guards.
The new draft entrypoint's offline check passed outside the restricted sandbox
(the sandbox denied Git subprocess execution); check mode read no key and
made no network request. Documentation, changed-file formatting, secret scan
and diff whitespace checks passed. No replacement-branch integration tests
were run: its local configuration remains stale and no schema was applied.

## Authorized local bootstrap integration

The user authorized local fetch/integration/commits, then separately authorized
CI fixture isolation fixes after the safety-flag mismatch was reproduced.
Remote main `3fce11932f189d940d72d0a9e3c91a8fd9943faf` integrated into
`cipher/analytics-archive` without conflicts. Tooling commit
`304b1e12e0577fc39c37ea7118fbda63ab09bedb` and prepared changes remain intact.
Five mocked fixture suites restore their inherited `SKIP_DB` after each test;
three added regressions verify the guard still blocks pool, policy SQL and
listener work. The focused run passed 25 tests with `CI=true SKIP_DB=true`.
No runtime guard, global test setup or workflow safety flag changed.

Review confirmed that release workflows have explicit dispatch-only triggers;
the smoke has no production secret references or migration/deploy commands.
Production credentials remain behind the separate human environment gate;
App publisher and draft helper only act when their explicit mutation modes
are invoked. No such mode was invoked during local preparation.
The effective ruleset/environment verification passed before this preparation;
strict checks are now enabled. Vercel remains connected and production unchanged.
The next account action still requires explicit approval of the separate
Git disconnect; App push/PR creation, remote merge and smoke dispatch remain
separate approvals. No final production release manifest exists.

Final local bootstrap validation passed with `CI=true SKIP_DB=true`: all
`npm run verify:agent` stages, including lint, TypeScript, Prisma generation,
smoke, full thresholded coverage and production build. 200 suites and 1,042
tests passed; six opt-in live database tests skipped. Coverage: 88.63% statements,
81.90% branches, 86.79% functions, 90.06% lines. Documentation and changed-file
formatting checks passed; the incoming main content/manifest also passed
formatting without modification. No live integration test was run against
the recreated Neon branch because its local configuration remains stale.

Recommendation: GO for the local bootstrap commit and subsequent review;
NO-GO for production rollout. No push, PR, remote merge, Vercel disconnect,
workflow dispatch, database migration or deployment was performed. The final
commit containing this record has both the tooling history and fetched main
as ancestors; its exact SHA is recorded in the final handoff and ignored
`.cache/bootstrap-readiness.json` after commit. No ticket ID was invented.
