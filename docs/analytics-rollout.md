# Analytics archive operations

This is the current source contract and dated read-only evidence for the analytics
archive. [DataGrip migration operations](analytics-neon-setup.md) owns reviewed
SQL execution and ledger handling. [Production releases](production-releases.md)
continues to own application deployment, exact-SHA CI and the human protected gate.
No new release workflow or migration framework is introduced.

## Current analytics database policy

James executes reviewed SQL manually through existing DataGrip connections,
development first and production only after development validation and fresh
production checks. Cipher and delegated agents stay read-only through all routes.
No branch, connection, URL or environment-file changes are permitted. Preserve
write-suite guards and leave database-writing tests unrun; James operates feature
checks. See the full [operating boundary](analytics-neon-setup.md#analytics-database-operating-boundary-wu-1205-amendment).
Application release and human approvals remain unchanged; no analytics SQL
executor is dispatched and no mandatory new recovery environment is introduced.

## Observed on 2026-10-29

Checkout inspected: `0abda1bc29631f613dfbc5b5d1f94b3827e421e6`.
Neon MCP read-only project, branch, endpoint and SELECT inspections found:

| Observation              | Evidence / limit                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Project                  | `rough-bush-94516855`, tullyelly.com, PostgreSQL 17, aws-us-east-2                                                     |
| Production-named branch  | `br-withered-snow-aea0yck6`; direct endpoint `ep-jolly-flower-ae4bmy06`                                                |
| Development branch       | `br-crimson-fog-ae22ws22`; direct endpoint `ep-flat-cherry-aepuz1d0`                                                   |
| Branch inventory         | Only production and development were returned; no `dev/analytics` branch                                               |
| Production catalog       | All five analytics tables and `dojo.schema_migration` absent                                                           |
| Production prerequisites | `tullyelly_admin`, admin app, admin role and `dojo.authz_bump_revision(uuid)` present; `admin.analytics.manage` absent |
| Development catalog      | `analytics_day`, `analytics_run` and ledger absent; other analytics objects not inspected                              |
| Inspection identity      | `tullyelly_db`, MCP role `neondb_owner`; this does not prove application-role access                                   |
| Recovery metadata        | Project history retention 86400 seconds; no restore rehearsal performed in this refresh                                |

Endpoint DNS suffix is `c-2.us-east-2.aws.neon.tech`. These are service metadata,
not proof of the deployed application's DATABASE_URL. SQL used catalog lookups
and prerequisite existence checks only; no production SQL writes, deployment,
secret retrieval or settings changes were performed.

The later WU-1207 read-only comparison independently inspected both existing
targets and found analytics schema/ledger absent on each, with matching inspected
authorization prerequisites. See the [dated comparison and manual development
handoff](analytics-migration-handoff.md#independent-development-and-production-assessment-2026-10-29).
No SQL execution or development feature validation is implied.

## Unverified configuration and readiness

The deployed application SHA/database binding, effective analytics environment
values, collector token validity, runtime cron registration/execution, preview
isolation, current recovery checkpoint/restore capability and Sentry delivery
were not verified. Do not infer these from branch names or old recovery records.
The checkout's `vercel.json` declares `17 9 * * *`; source configuration does not
prove an active scheduler. No current live Vercel API or collector test was run.

`ANALYTICS_SYNC_ENABLED` permits collection only when exactly `true` in
`lib/analytics-archive/operations.ts`. A release summary saying “collection remains
disabled” is hardcoded in `scripts/analytics-release.ts` and
`.github/workflows/analytics-release.yml`; that line alone proves no current
configuration. Require evidence bound to the actual deployed revision and runtime.
Do not trigger collection merely to obtain read-only evidence.

Old October fixtures, integration passes and branch IDs are preserved in the
[historical recovery record](archive/analytics-october-recovery.md) and
[historical setup](archive/analytics-october-setup.md). They do not establish
current rehearsal, SQL application or production readiness. With the observed
missing schema/ledger, analytics migration preparation and per-file historical
reconciliation remain necessary before activation.

## Upstream coverage contract

The client requests one completed UTC day with inclusive bounds, explicitly
filters production and groups exact request paths without query parameters.
It requests 100 paths per batch and excludes staged paths on subsequent queries
when Others remains. Only full enumeration plus reconciliation with a separate
sitewide daily total publishes a day. Duplicate paths, malformed metrics, unknown
buckets and mismatched totals fail closed. Exclusion URLs stop at 24,000 characters;
upstream limits can be lower and large-day compatibility remains unverified.

Empty responses do not establish zero traffic. Explicit zero metrics and complete
enumeration are required. `ANALYTICS_AVAILABLE_FROM` must be an owner-confirmed
first fully available UTC day, accounting for activation and retention; never infer
it from empty results. Earlier dates are unavailable, not zero. Daily visitors
are not distinct lifetime visitors; never sum page visitors into sitewide visitors
or add overlapping lifetime and daily counts. Reassess the availability floor as
retention advances. Old unavailable cursor ranges need a deliberately reviewed
reset on a confirmed safe target before revisiting them.

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
After a successful daily cursor day, the same completion transaction can advance
across up to 31 following contiguous archive days whose status is `complete`,
`zero` or deliberately `unavailable`. A missing, incomplete or API-failed day
stops advancement. Days within the three-day refresh window must also have been
successfully resolved in this invocation; retained old totals cannot hide a
truncated or failed recent refresh. This lets catch-up converge across coverage
already established by earlier recent-day refreshes while the calendar advances.
The bounded scan makes no additional Vercel requests and never affects the
independent backfill cursor. Failed writes roll back the cursor and summary
together; run failure/bounded status and the 36-hour daily freshness rule remain
unchanged. The scan does not count skipped days as newly processed days.

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

Do not put these values in NEXT_PUBLIC variables. No shared data cache is introduced. Public read semantics and cache behavior are described below. Phase 2 authorization, scheduling and observability are described
below. SQL migrations use the existing ledger and
require the reviewed target-specific procedure in the DataGrip guide.
Never invoke collection or migrations during builds.

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
has the function's duration limit. Confirm plan-specific execution timing against the
[Vercel cron documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
The effective deployed schedule remains unverified in this refresh.

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
Confirm the effective project/runtime duration limit before deployment. See
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

## Phase 3 public display

Public statistics: **https://tullyelly.com/stats** (local `/stats`). The shared footer and Chronicle counters link to it using existing link
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

## WU-1208 owner-operated development confirmation

The moving-clock interruption case is verified with mocked connections and API
responses. No agent ran live collection, import, rollback fixtures or the
write-producing integration suite. Existing migration files, connection strings,
environment files and disposable-suite guards are unchanged. Shipping this change
still depends on WU-1210's reviewed release compatibility work and the existing
application approval process; no release is authorized here.

For James's WU-1212 development checks:

1. First finish the manual schema/ledger handoff and read-only postflight from
   WU-1207. Confirm existing API scope, supported UTC reporting window and direct
   connection compatibility without changing URLs. Start the local server yourself.
2. Record the existing daily cursor, recent run statuses and verified/unavailable
   dates. If an outage backlog naturally exists, note its earliest unresolved day.
   Do not rewind cursors, alter the clock or corrupt shared development to manufacture
   an outage; that reproduction stays mocked when no natural backlog exists.
3. Operate **Run now** yourself and record its processed/request counts and outcome.
   Each invocation retains four collected-day slots, eight logical requests and
   a 35-second deadline. Read-only review must show every date crossed by a cursor
   jump was verified/zero or deliberately unavailable; unresolved gaps must remain.
4. Repeat bounded runs as needed. Recent refreshes remain included; repeating a
   completed day replaces its summary rather than adding to it. Compare stored
   counts to the same upstream day, allowing for actual upstream revisions.
5. Observe the next normal UTC daily run when enabled by you. Confirm catch-up
   reaches the completed-day boundary and a completed daily run, rather than a
   backfill or partial batch, establishes daily freshness. Preserve visible failure
   status and timestamps. Do not trigger collection on production for validation.

James-operated development results and read-only postflight for this code change
remain pending. Failure, empty/zero, unavailable, truncation, rollback, deadline
and gap cases are mocked evidence; they are not live outage or notification proof.

WU-1208 local evidence: the new moving-clock regression failed before the code
change and passed afterward. The focused collector/operations suites passed
40 mocked tests. The database-disabled `npm run verify:agent` baseline passed in
124.2 seconds: 241 suites and 1,906 tests passed, with 2 suites and 6 opt-in
PostgreSQL tests skipped. Coverage thresholds, lint, typecheck and production
build passed. Docs, explicit changed-file formatting and the self-fetch check
passed; the latter used Node's tsx loader after the CLI hit a sandbox pipe error.
The punctuation check still reports existing em dashes in unchanged
`HomieDirectory.tsx` and `FirstOffTheLineSection.tsx`. These results establish
mocked/build validation only; the owner-operated live checks above remain pending.
