# Admin discovery and mobile menu handoff

This follows [public coverage 094](public-menu-coverage.md). Repository changes do
not establish database application or deployed verification. James executes all
reviewed SQL in his existing DataGrip connections; agents remain read-only.

## Application changes and order

Deploy the shared explicit-requirements resolver **before** applying migration 095. Filtering and serialization normalize string entries in `meta.requires`;
a nonempty result replaces the visibility gate derived from `feature_key`.
Every requirement must pass. Missing, malformed or empty normalized arrays fall
back to the trimmed feature key, then to ungated if neither source exists.
The feature key is retained for analytics attribution. Hidden/unpublished rows
remain excluded; rejected and synchronously thrown checks fail closed and retain
per-feature decision caching. Authorization features and server checks do not
change.

Mobile keeps its quick Shaolin landing control below Home and offers an ordinary
Shaolin accordion only when allowed non-landing children exist. It uses the shared
children map, excludes the duplicate landing from that accordion and gives the
quick control a separate ID. Existing drawer scrolling, navigation, focus, Escape
and closing handlers remain in use. The longer desktop and mobile persona lists
remain scrollable without truncating their final links.

Analytics administration is rendered in the request-scoped Admin layout by
`AnalyticsNavigation`, behind the layout's existing strict `admin.app.view`
boundary. The link reuses `requireAnalyticsOwner`: authenticated owner identity
plus strict `admin.analytics.manage`. Failures hide the link; no collector or
mutation is called. No owner decision enters the capability-keyed shared menu
cache. The destination retains its own server checks.

The Admin landing still calls `listMemberships`, which requires
`admin.membership.manage`. An owner with app-view and analytics-manage but without
membership-manage can reach Analytics directly and see its layout navigation
there, but cannot use the Admin landing or its global menu entry. This is an
intentional preserved boundary, not evidence for broadening permissions. No
individual owner's private membership assignment was inspected or changed.

Fallback data retains its legacy protected Admin key conservatively, removes
stale aliases, and includes all 15 additions and eight public browse repairs.
Ordinary runtime menus still load database rows. No fallback edit installs SQL.

## Read-only observations and migration 095

Both existing branches of project `rough-bush-94516855`, database `tullyelly_db`,
were inspected independently: development `br-crimson-fog-ae22ws22` and production
`br-withered-snow-aea0yck6`. Both ledgers have matching applied 094
(`f667053fcf6bf53f5ab25c2661c63052d1fefc22932de8f6818f0372a2bb7e0b`);
095 was unused in both ledgers and the checkout before this task. This task did
not apply 094 or verify all of its live effects.

Each has exactly one `/mark2/admin` row with `menu.mark2.admin`, empty metadata,
mark2 root parent, published true and hidden false. Its legacy feature has no
role-feature grants. `admin.app.view`, `admin.membership.manage` and
`admin.analytics.manage` are existing enabled `admin`-scoped features;
`menu.mark2.admin` is an existing enabled `menu`-scoped feature.

[095_restrict_admin_menu_requirements.sql](../db/migrations/095_restrict_admin_menu_requirements.sql)
updates only the existing Admin metadata and update audits. It merges
`requires: ["admin.app.view", "admin.membership.manage"]` while preserving all
other metadata, ID, label, URL, parent, target, ordering and publication. It creates
no menu rows or capabilities and changes no grants, memberships or enabled flags.

It accepts absent/empty requirements or that exact reviewed array; conflicting
requirements, duplicate href/feature identities, wrong roots, suppressed content,
missing/disabled/wrong-scope capabilities or newly granted legacy features stop
execution. It resolves IDs rather than hardcoding them. The menu table lock
serializes competing writers, including operators without advisory locks;
feature/app/grant SHARE locks stabilize those checks. Five-second lock and
30-second statement timeouts bound execution. A rerun changes no menu/audit rows.

Against the observed Admin baseline expect **one updated row, zero inserts, no
change in total rows**. If already installed, expect zero updates. Other rows and
Admin metadata outside `requires` must be byte-for-byte equivalent as JSON.

## James's DataGrip steps

Follow [migration policy](migrations.md), [owner execution](analytics-neon-setup.md#owner-execution-of-an-approved-file)
and the existing [protected production approval](production-releases.md).

1. Review an immutable checkout and the exact file hashes below. Development
   first; privately verify the existing DataGrip TLS endpoint matches its branch
   and owner-confirmed binding. No new connection, environment or Neon branch.
2. Run the complete [read-only preflight](../db/operations/095_admin_menu_preflight.sql).
   Save ledger, total rows, unrelated-row JSON, Admin preserved-field JSON and
   metadata outside `requires`. Stop on conflicts, failed/unknown ledger entries,
   checksum drift, occupied numbering or changed target state. Historical gaps
   remain a separate review; do not bulk-baseline or replay old files.
3. Confirm the requirements-aware application is available in development. Review
   094's application independently; 095 does not depend on a forced total of 48.
   Coordinate the existing session release lock from the owner procedure and do
   not run another executor concurrently. James executes the entire
   [atomic bundle](../db/operations/095_apply_with_ledger.sql), including its
   individually scoped ledger record. Do not nest BEGIN/COMMIT or run both the
   original and bundle as separate applies. The ledger checksum names the original
   migration. On error, Stop and ROLLBACK; after uncertain COMMIT, inspect read-only
   before retrying. Release the session lock afterward.
4. Restore read-only and run [postflight](../db/operations/095_admin_menu_postflight.sql).
   Require identical unrelated rows, Admin preserved fields and non-requirements
   metadata. Verify the exact requires array and retained attribution key, total
   rows and exact applied ledger row. Save execution evidence. James may rerun in
   development and compare full results to prove no unnecessary audit changes.
5. Only when the original file was separately executed successfully, use the
   [ledger-only handoff](../db/operations/095_record_applied.sql) after exact-file
   execution evidence and postflight. Matching valid ledger rows remain unchanged;
   conflicting rows stop. Installed effects alone do not prove exact execution.
   Reconciliation timestamps are current and original duration is unknown (NULL).
6. James validates development menus for anonymous, partial and full Admin
   capabilities, and owner/non-owner Analytics access. Before production, obtain
   concrete existing protected approval, review actual backup coverage and accepted
   recovery limitations, and run a fresh independent production preflight. Then
   James repeats only the reviewed manual steps. No recovery test or backup
   coverage was established here; no restore, branch reset or deployment ran.

Partial rollout remains conservative: old code with new metadata still checks the
ungranted `menu.mark2.admin`; new code with old metadata falls back to that same
key. The migration checks the no-grants assumption again. Existing menu caches
revalidate on a 300-second interval; SQL does not invalidate every rendered menu.
Allow subsequent requests to revalidate, then reload and check signed-out and
signed-in navigation. A five-minute interval is not universal refresh proof.

## Exact SHA-256 values

- `db/migrations/095_restrict_admin_menu_requirements.sql`: `e8952aaa34b9c4dbe00cfd6d594d439a17ab79890d67c7cd6d2a0bdd3870f490`
- `db/operations/095_admin_menu_postflight.sql`: `bfa99898f5051fc0c1fca3f562e65bbcaba9cbc60a6530dc8f63563c2f7e45bb`
- `db/operations/095_admin_menu_preflight.sql`: `9776b381d48b06e4000eefdd9313d03434c4f78c3d41e1129e04019bdf9e51b4`
- `db/operations/095_apply_with_ledger.sql`: `1249cec12318a3600da54a6fbd12292215cc34e68007f33c676573a64138eb56`
- `db/operations/095_record_applied.sql`: `66da3ccf97fb58afff48311b176643f5ef4f4fead9fba7745545626288acbc96`

## Verification and limits

- Both exact preflight assertion blocks passed on the existing targets in explicit
  repeatable-read READ ONLY transactions, with `transaction_read_only=on` confirmed.
  No migration, ledger handoff or database-writing integration fixture ran.
- Mocked regression coverage uses representative post-094 rows through the actual
  shared builders and menu loader. It covers public visibility with empty
  capabilities, both Admin requirements and retained attribution, malformed/empty
  requirements fallback, caching, synchronous/asynchronous failure, suppression,
  fallback inventory, site page search, command queries, ordinary mobile tags,
  unique IDs, account/home/search duplication, drawer closing, Escape/focus and
  final links in the longer sections. Owner navigation tests reuse the real
  Analytics authorization helper with mocked session and strict permission checks.
- The required `SKIP_DB=true npm run verify:agent` was invoked once. Workflow
  validation, content preparation and lint passed; TypeScript caught invalid
  Testing Library options in the new tests, which were corrected. TypeScript and
  Prisma generation then passed as separate stages. Sandbox Jest initialization
  hit Next's TypeScript `--showConfig` subprocess issue; database-disabled Jest
  ran with sandbox escalation. An existing Categories fallback test was updated
  to assert the requested public visibility after the first coverage run caught
  its obsolete feature-key expectation.
- Final Vitest results: all seven files passed across the full suite and focused
  reruns, totaling 36 tests. Final Jest coverage: 248 suites and 2,006 tests passed;
  two suites and six opt-in tests were skipped. Coverage was 88.63% statements,
  81.90% branches, 86.79% functions and 90.06% lines, above required thresholds.
- The database-disabled Next production build passed after sandbox escalation;
  the initial sandbox compiler stalled and was stopped. No dev server or
  deployment ran. Build-generated changes to `next-env.d.ts` were removed from
  the review diff. The baseline entry point was not rerun; its remaining stages
  were completed individually after correcting the test type errors.
- Final changed-file Prettier, documentation checks, TypeScript, SQL artifact
  checksum/body/read-only checks and `git diff --check` passed. The normal
  format-check command with HEAD as base had no committed diff to check; explicit
  changed-file Prettier includes untracked additions.
- The repository-wide em-dash check reports existing violations in
  `app/cardattack/homies/_components/HomieDirectory.tsx` and
  `components/FirstOffTheLineSection.tsx`; these unrelated files remain unchanged.
- Normal browser E2E and rendered screenshots remain unrun: their prehook seeds
  a database and their configured webServer starts an app. No dev server started.
  Component DOM tests establish interactions, not real viewport layout, deployed
  routing, live SQL concurrency/rerun behavior or production verification. James
  owns development write-producing validation and subsequent approved application.
