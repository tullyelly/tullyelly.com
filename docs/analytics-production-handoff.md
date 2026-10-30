# Production analytics handoff; WU-1213

This is an activation proposal for the existing application release process.
It is not a deployment receipt. James confirmed production variables were saved
with collection off and no redeploy, then explicitly confirmed his production
DataGrip read-only postflight passed and the existing application's database
binding matches the production host/database/role below. Those are owner-reported
facts; Cipher has not retrieved environment values or credentials.

The proposed `releases/analytics-state.json` now requests **on** for a future
reviewed release. Saving/committing that source record changes no running process.
It still needs code review, trusted exact-SHA CI, current metadata/compatibility
checks and James's existing `production-release` approval. No new release or SQL
workflow is added. Enabled intent applies to the staged production deployment
already; promotion does not turn the flag on later. Its staging acknowledgement
is part of the proposal for review at the existing human gate, not evidence that
that gate was approved or a release executed.

## Current independent read-only evidence

Inspection times are UTC on October 30, 2026 (October 29 in Chicago). The
`manualReadiness.checkedAt` values identify the supporting fresh read-only
postflight times, not guessed times of James's SQL execution or browser actions.
James's manual execution/validation confirmations are recorded under WU-1212
and WU-1213. MCP inspected as `neondb_owner`; James separately confirmed the
production application binding and application-role DataGrip postflight.

| Check                                                           | Existing development                                 | Existing production                                  |
| --------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Postflight time                                                 | 03:59:28.926Z                                        | 03:59:43.778Z                                        |
| Branch                                                          | `br-crimson-fog-ae22ws22`                            | `br-withered-snow-aea0yck6`                          |
| Direct endpoint ID                                              | `ep-flat-cherry-aepuz1d0`                            | `ep-jolly-flower-ae4bmy06`                           |
| Database / application role                                     | `tullyelly_db` / `tullyelly_admin`                   | `tullyelly_db` / `tullyelly_admin`                   |
| Expected columns/owners                                         | Match                                                | Match                                                |
| Validated constraints                                           | Match                                                | Match                                                |
| Selected original 076/077 ledger records                        | Applied, exact sha256, timestamps present, no errors | Applied, exact sha256, timestamps present, no errors |
| Enabled admin analytics allow grant                             | Present                                              | Present                                              |
| Application schema usage / ledger SELECT / archive table rights | Present                                              | Present                                              |
| Runs / days / cursors                                           | 4 / 8 / 2                                            | 0 / 0 / 0                                            |

Production target SHA-256, computed using the existing fingerprint function:

```text
911585abc1a11bc8b40cd57e28b5a1391e6262345f11a15db7d5a83a499b01c9
```

It binds the expected host/database/role, not the password. A future runtime must
report this exact target and `connection=direct`; publishing a Neon direct host
alone is not proof of a deployment's effective connection. James has privately
confirmed that binding; staged/public state acceptance still checks it again.

No SQL write file is selected. Do not rerun ledger initialization or 076/077.
The original immutable SHA-256 values remain:

| File                               | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `076_create_analytics_archive.sql` | `0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553` |
| `077_analytics_operations.sql`     | `88584aa867075149dc0b7d1b984262443462493c0e446fb8c00122446128f694` |

For another assessment, use only the existing production DataGrip connection,
Read-only on, no open transaction, and the entire
[90_read_only_postflight.sql](../db/operations/analytics/90_read_only_postflight.sql).
Stop for target mismatch, unexpected partial schema, contract mismatch, absent or
incorrect selected ledger records/grants, or uncertain earlier COMMIT. Never
repair such differences by replaying history or marking everything applied.

## Development evidence carried into this handoff

WU-1212 is Done. James operated the local development server, connection test,
collection/import and browser/login checks; Cipher verified database results
read-only. Development fingerprint matched its expected target. Eight days,
October 22 through 29, completed in two four-day/eight-query batches; the first
was bounded and the second completed. Stored daily/page totals reconcile to
287 pageviews. This demonstrates normal bounded continuation, not injected-fault
or forced-crash recovery on shared development.

The October 28 repeat retained 15 pageviews, 7 daily visitors, 9 paths and exact
metric fingerprint `b035ccf5ddd4f63c29e9d000cf115e27`; no double-counting was
observed. James independently confirmed the Vercel Production dashboard for
**00:00:00 through 23:59:59 UTC** matches 15/7. The earlier 18/8 screenshot used
Chicago midnight (05:00 UTC through 04:59:59 UTC the next day); those windows
are different. Do not treat an unadjusted local calendar date as UTC evidence.

After James approved the existing Vercel connector's team access, independent
read-only connector API requests for that exact production UTC day returned
15 pageviews, 7 visitors and nine requestPath buckets with no Others bucket.
All nine per-path pageview and visitor values match the development archive.
This supplements the owner's dashboard confirmation. Connector authentication
is distinct from the configured collector credential; the actual James-operated
development connection test/import establishes that collector transport evidence.

A separate daily run completed at 03:30:49.715Z, three days/six queries, with the
daily cursor at October 30; October 27 through 29 have daily provenance and
reconciled totals. Backfill did not clear daily staleness or alter its cursor.
James reports owner report, non-owner denial, anonymous login redirect and public
stats/Chronicle scope checks passed. These browser/dashboard results are
owner-reported, not agent-operated session actions or a fresh agent API result.
Unsafe faults, interrupted/empty/zero/gap cases have mocked coverage; six disposable
database-writing integration tests and restore rehearsal remain unrun.

## Owner-confirmed settings and unresolved checks

James reports all production settings below saved privately, no Redeploy action,
with the collection setting **false**. No existing database URL or environment
file was changed by Cipher. No settings values were downloaded to verify this.

| Production variable        | Vercel type | Preparation state                                                                             |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `ANALYTICS_PROJECT_ID`     | Config      | Existing project `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`                                           |
| `ANALYTICS_TEAM_ID`        | Config      | Existing team `team_pB5TcLa7apLtPAiVrRbcjBG3`                                                 |
| `ANALYTICS_VERCEL_TOKEN`   | Secret      | Owner reports saved; production transport still unverified                                    |
| `ANALYTICS_AVAILABLE_FROM` | Config      | `2026-10-22`; development import verified October 22-29, not an all-time guarantee            |
| `CRON_SECRET`              | Secret      | Owner reports separately generated/saved; never included in this handoff                      |
| `ANALYTICS_SYNC_ENABLED`   | Config      | `false` while preparing; approved release intent supplies its own non-secret runtime override |

The future on-intent release overrides only `ANALYTICS_SYNC_ENABLED=true` for
that deployment. It does not edit dashboard settings or database URLs. Thus the
saved dashboard false value is preparation state, not proof of a future on-intent
deployment's effective value. Inspect the runtime endpoint for actual state.

The original metadata attempt returned **403 team-scope access denied**. James
subsequently approved the existing connector's team consent. A fresh read now
confirms READY production deployment `dpl_5kXM8TLD21DfraQPSPohSZVH7RHb`,
SHA `819966fde2630f8b86f19c5897e2701ab824a157`, and both public aliases
`tullyelly.com` / `www.tullyelly.com` pointing to that deployment in the expected
project. Team consent is metadata access, not deployment approval. Do not substitute a personal
CLI login, retrieve credentials, pull/decrypt environment variables, or bypass
existing checks. Keep current non-secret metadata bound to the exact release through the existing
authorized process; recheck it if production changes. Production credential transport and effective deployed state
remain unverified until read-only runtime/owner checks after the approved release.

Recent GitHub workflow metadata reports a successful native production run
[40822139230](https://github.com/tullyelly/tullyelly.com/actions/runs/40822139230)
for `819966fde2630f8b86f19c5897e2701ab824a157`. Its sanitized production report
artifact explicitly records deployment `dpl_5kXM8TLD21DfraQPSPohSZVH7RHb`,
`deployment_succeeded=true`, **`public_verified=false`**, and public verification
pending. This is newer evidence than the October 26 audit, not current public
acceptance. A green run alone is not proof of `public_verified=true`, current
alias ownership or the presently serving SHA. Resolve that pending state through
the existing public-verification procedure; do not mark it passed from run status.
Credential-maintenance ticket WU-888 is Done, which is not password-rotation
execution proof. No credential-maintenance run appears in the 61 returned
workflow-dispatch runs (requested limit 100). That metadata inventory does not
establish whether a password was changed outside this workflow or a run deleted.
Current password rotation/consumer status still needs non-secret operation evidence;
do not reset or rotate passwords as part of analytics preparation.

The original working branch `cipher/2026-10-29-homie-snapshot-difference` contains
earlier analytics commits and pre-existing
`0abda1bc` (WU-1217). Compared with main `819966fd`, it includes migration
`088_enforce_homie_tcdb_snapshot_difference_sign.sql` and the homie snapshot
schema mirror. **Do not release that entire branch as an analytics-only package.**
No PR was returned for it during the check. The isolated publication branch
`cipher/2026-10-29-analytics-activation` now copies only analytics commits onto
main `819966fd`; it excludes 088 and the homie schema mirror. The original branch
and WU-1217 work remain intact. Neither original migration nor schema mirrors
differ from main on the publication branch. Do not execute 088 or include it in
this analytics release.
The existing schema-deferral record binds a different production baseline and SQL
diff; it does not waive these changes. Preparation must validate compatibility
against current metadata, not silently rebind or waive it because analytics 076/077
are applied. Category/membership SQL also stays outside this package.

## Recovery and monitoring limitations before approval

Fresh Neon project metadata still reports `history_retention_seconds=86400`:
24-hour retained history, not indefinite archive backup. Available restore
checkpoints, independent/offsite backups, achieved recovery time and successful
restore rehearsal are unverified. No new recovery branch, snapshot, restore or
reset is performed or required. The owner must review and accept those limits at
the existing production gate; do not invent backup evidence to make a check pass.

Use the existing Sentry [monitoring handoff](analytics-monitoring.md). The
`analytics-daily` monitor/notification rule and a real delivery receipt remain
unverified. Creating a local CRON_SECRET or running manual daily collection is
not monitor setup or scheduled-job proof. Production scheduling remains unverified
until an actual 09:17 UTC invocation and corresponding run/check-ins are observed.

## Numbered continuation; human actions remain explicit

1. Vercel metadata access and current alias baseline are confirmed. Resolve
   outstanding public-verification/credential evidence and refresh stale checks.
   Stop for unresolved identity/configuration drift or unaccepted recovery limits.
2. Review the prepared analytics-only publication branch, its exact activation
   intent and complete source diff; WU-1217 is excluded and preserved separately.
   Use the existing
   PR/main process and trusted exact-SHA CI. Source/configuration changes invalidate
   earlier release evidence. Do not dispatch a database executor or direct Vercel
   Redeploy; do not weaken compatibility, SHA, configuration or approval checks.
3. The authorized coordinator initiates only a separately approved production
   release via the existing App dispatcher. James reviews intended on, production
   fingerprint, 076/077 checksums, manual readiness references, backup limitations
   and staged-on semantics at the existing `production-release` gate. Cipher never
   approves it. No extra release framework or second approval gate is introduced.
4. Existing staging acceptance must report the exact approved revision, effective
   on, configured, direct production fingerprint, schemaReady and ledgerReady.
   Mismatch stops promotion. The same deployment ID is promoted after the baseline
   recheck. Public checks must pass; a pending Cloudflare/public result is not full
   acceptance. No probe invokes collection/import or supplies the Cron secret.
5. James opens the live owner page, runs Test connection, imports one completed
   supported UTC day and reports outcome. Cipher reconciles read-only; James
   repeats that same day and Cipher compares counts/fingerprint. Prefer October
   28 only while it remains supported; use independently confirmed UTC bounds and
   actual fresh API totals, not forever-hardcoded historical counts.
6. James operates Run now/history controls as needed, then bounds the selected
   history import with explicit gaps/progress. This never substitutes for observing
   the real scheduled 09:17 UTC Cron. Correlate Vercel scheduling, committed daily
   run, Sentry check-in and notification delivery before declaring production done.
7. To stop future collection while retaining data, James uses the same reviewed
   release process with explicit off intent, confirms runtime off, and pauses the
   external monitor. Changing only the dashboard false value does not change the
   immutable environment of a running on-intent deployment. Do not delete archive
   rows, replay migrations, restore databases or trigger automatic rollback.

WU-1213 and WU-1205 remain open until the actual production evidence is recorded.

## Preparation validation

The first owner-run App publication attempt stopped in the required smoke hook;
remote verification then lost its connection and reported unknown publication.
Independent GitHub ref inspection confirmed the review branch was absent, and
the owner-run publisher reported its scoped token revoked. Do not blindly retry
an unknown result. Git-backed test fixtures had inherited the hook's `GIT_DIR`
and inline Git configuration, causing fixture initialization/commits to affect
the unpublished review branch and the shared bare setting. The known review
commit/index and normal bare setting were restored without changing working
files or the original branch. Jest now removes that repository-local/auth
configuration in its child process before loading tests; the parent push retains
its scoped transport authentication and all smoke/coverage hooks remain enabled.
A disposable Git-only regression verifies HEAD/index/config isolation. Publication
must use the corrected exact commit after hook-context validation; the original
attempt's SHA is not the retry target.

The activation JSON validates against the existing intent schema. Before the
hook repair, the activation checkout passed the full 1,980-test baseline. The
isolated checkout's first build hit Turbopack's outside-workspace dependency
restriction; localizing installed dependencies resolved that without an
application-code or live-configuration change.

For the hook repair, a disposable Git-only regression passed and a reproduced
hook-shaped smoke run passed 24 suites / 550 tests, with three guarded skips.
The full `verify:agent` baseline then passed in that same hook-shaped environment:
247 suites / 1,981 tests, thresholded coverage and Next production build; six
database-writing integration tests stayed skipped. Review HEAD/index, main refs,
remote and normal bare setting stayed intact. Documentation, formatting and diff
checks passed. These are preparation results, not trusted merged-SHA CI or live
acceptance. No deployment, collection, SQL write, secret retrieval or live settings
change was performed by Cipher.
