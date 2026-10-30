# Owner analytics validation; WU-1212

This checklist validates the existing implementation. James operates DataGrip,
local app startup, login, collection and import. Cipher inspects results read-only.
No new branch, connection, environment file, credential retrieval, fixture or
migration executor is used. WU-1212 remains open until the manual evidence exists;
WU-1213 production launch depends on that evidence.

## Current evidence, not launch approval

Read-only checks at **2026-10-30 01:20-01:24 UTC (October 29 local)** independently
inspected both existing branches in Neon project `rough-bush-94516855`:

| Check                                  | Existing development      | Existing production         |
| -------------------------------------- | ------------------------- | --------------------------- |
| Branch                                 | `br-crimson-fog-ae22ws22` | `br-withered-snow-aea0yck6` |
| Expected columns including owners      | Match                     | Match                       |
| Validated constraints                  | Match                     | Match                       |
| 076 recorded applied, original SHA-256 | 2026-10-29 23:19:27.984Z  | 2026-10-29 23:20:36.631Z    |
| 077 recorded applied, original SHA-256 | 2026-10-29 23:19:56.991Z  | 2026-10-29 23:20:48.160Z    |
| Selected ledger errors                 | None                      | None                        |
| Feature / admin grant                  | Enabled / allow           | Enabled / allow             |
| Runs / days / page-days / cursors      | 0 / 0 / 0 / 0             | 0 / 0 / 0 / 0               |

Recorded execution durations are respectively development 2466/2628 ms and
production 2323/1892 ms. The selected records use `sha256`, have non-null applied
UTC timestamps, and exactly match the original 076/077 hashes in the
[handoff](analytics-migration-handoff.md#checksums). These observations supersede
the earlier absent-schema assessment. **Do not rerun ledger initialization or
076/077.** No historical rows were added by Cipher. MCP connected as
`neondb_owner`; it does not prove James's application-role access, his execution
session, revision deltas or notification delivery. Retain his COMMIT/postflight
results separately; no execution provenance is invented from catalog presence.

The agent process has no analytics token/project/team/availability configuration
available; no secrets or environment files were read or changed. Collector-token
transport, actual source project/team, earliest fully available day, local runtime
configuration, browser behavior, notification delivery and scheduled invocation
remain unverified. Endpoint metadata publishing a direct hostname does not prove
which hostname the existing app uses. An incompatible pooled runtime must be
reported before collection; leave the URL unchanged.

## Numbered development checklist

The new read-only reconciliation file has SHA-256
`2a79c2ec8248569ead1393e69d17c88684c4aa008cdffd77fc5d664fedfa14ca`.
Its SELECT syntax was checked on existing development with an explicitly
unselected diagnostic project: missing metrics remained null, not verified zero.
This is not a real-day or collector-token reconciliation result.
Run the entire SQL file with stop-on-error, no open transaction and DataGrip
Read-only enabled. Its named parameters are `project_id`, `day`, `api_pageviews`
and `api_visitors`; use the existing
[DataGrip parameter dialog](https://www.jetbrains.com/help/datagrip/run-a-query.html).
Stop if parameters are not recognized or values/target are uncertain; never
execute highlighted fragments or replace unknown API totals with zero.

1. **Confirm target and reviewed source.** Use the existing development DataGrip
   connection, Host matching the development branch's current direct endpoint,
   TLS, database `tullyelly_db` and role `tullyelly_admin`. Record the checkout SHA
   and confirm the local app uses existing development, never production. Keep
   credentials and URLs private. Start with no open transaction and Read-only on.
   Run [00_read_only_preflight.sql](../db/operations/analytics/00_read_only_preflight.sql)
   to inspect current identity and prerequisites; its older absent-schema
   expectation is superseded by the applied state above. Then run
   [90_read_only_postflight.sql](../db/operations/analytics/90_read_only_postflight.sql).
   Require both contract comparisons true, exact selected applied hashes, enabled
   feature/admin allow grant and reviewed function/trigger definitions. Stop for
   drift, failed/missing/mismatched ledger rows, wrong target or unresolved grants;
   do not replay a migration to repair it. No write SQL is selected in this state.
2. **Confirm source and supported day privately.** Verify the existing analytics
   project/team and token scope in your existing configuration/account; a personal
   Vercel CLI login is not collector-token proof. Choose an exact fully completed
   UTC day D within independently confirmed reporting availability. Prefer
   yesterday if fully available; no current-day or guessed historical zero.
   Record only project/team IDs, D and supported-window evidence. Verify existing
   direct/unpooled compatibility before collection. If configuration/access is
   missing, stop and report that prerequisite; do not change database URLs or
   request another environment/connection. Cipher leaves environment files alone.
3. **Start your existing local app.** You start/stop it; Cipher does not start a
   server. Keep collection off initially and open `/api/health/analytics`; confirm
   exact source revision when available, effective off, connection class and target
   fingerprint. An unavailable/unknown build revision in local development is not
   acceptable production evidence. Sign in as the actual owner and open
   `/mark2/admin/analytics`. Use **Test connection** yourself. Save its controlled
   result; it uses the configured collector token for a read-only completed-day
   query, not your CLI credential. Its success alone does not expose exact totals,
   prove available history or establish zero from an empty response.
4. **First selected-day collection.** After the checks above, you enable collection
   in the existing development app process using your approved local procedure,
   without editing database URLs or providing secrets to Cipher. Select From=D
   and Through=D; click **Import history** once. This explicitly targets one day;
   **Run now** targets recent daily refresh/catch-up, not a user-selected day.
   Record outcome, processed/request counts and UTC times. Failure, incomplete
   enumeration or unavailable history is a stop for reconciliation, not a zero.
5. **Exact reconciliation, read-only.** Obtain the production-filtered upstream
   aggregate for D using the same configured collector credential/project/team:
   `by=day`, `since=D T00:00:00.000Z`, `until=D T23:59:59.999Z` (no spaces in actual
   ISO values). Use the existing Web Analytics aggregate API contract in
   `lib/analytics-archive/client.ts`, including `environment eq 'production'`.
   Enumerate exact `requestPath` buckets to exhaustion; `Others` is not a page and
   a single 100-row response is not full coverage. Do not share bearer headers or
   raw response logs. If that read-only API access is unavailable, mark live
   reconciliation pending; dashboard/personal CLI access is not a substitute.
   Run [analytics-validation.sql](../db/diagnostics/analytics-validation.sql)
   with parameters project ID, D and the independently observed API totals.
   Require one verified sitewide day, matching pageviews and visitors, full page
   enumeration/pageview sum, and exact per-path comparisons. Never sum page visitor
   counts to infer sitewide unique visitors. Record the stable row fingerprint,
   page count and totals as the pre-repeat baseline; Cipher can verify read-only.
6. **Repeat without double-counting.** Click **Import history** again for exactly
   D..D, then rerun the same read-only reconciliation. Given unchanged upstream
   data, counts, page cardinality and metric fingerprint must remain equal;
   run ID and collection timestamp may change. If upstream changed, reconcile
   both snapshots against fresh API evidence before judging replacement behavior.
   Do not delete rows/reset shared development to produce the expected result.
7. **Bounded import and safe resume.** If at least five completed supported UTC
   days exist, choose exactly five consecutive days, submit **Import history**,
   and record the saved range/cursor. The configured batch limits are four days,
   eight requests and 35 seconds; enumeration may use the budget sooner. Use
   **Continue import** for each remaining bounded batch and verify the same range
   and advancing cursor until finished or an explicit gap/failure stops progress.
   A result with gaps is not fully verified history. A shorter available window
   means this live check is unavailable. Do not kill processes, inject SQL faults,
   reset cursors or create fixtures in shared dev; interruption/failure/zero/empty
   and gap behavior have safe mocked coverage. Closing/reopening the page between
   normal batches is the safe live resume check.
8. **Daily lane separately.** Use **Run now** yourself; record daily cursor,
   last daily success and latest verified date independently of the backfill
   lane. A manual import must not clear the daily stale indicator or emit a Cron
   check-in. Manual Run now is not proof of a scheduled invocation. Yesterday
   should be verified within a fresh daily run; existing older gaps can still
   need catch-up. An overlap response means retry later manually, without locks
   being changed or another executor being started.
9. **Browser scopes and authorization.** You operate real owner, signed-in
   non-owner and anonymous/private sessions; Cipher does not log in or submit
   controls. Owner: private report range D..D matches all verified sitewide D
   pageviews, per-path results and coverage. Non-owner: private report/control
   access denied. Anonymous: private page redirects to login, no private metrics
   or controls disclosed. Do not invoke denied write controls just to test them
   against production. Confirm `/stats` and a published Chronicle counter in
   anonymous and signed-in sessions expose only the current published-path
   allowlist (`/shaolin`, `/stats`, non-draft Chronicle URLs); draft, admin and
   unrelated paths never appear publicly. Public subset totals can correctly be
   smaller than private sitewide totals. Compare matching date scopes and allow
   up to five minutes for public cache revalidation; absence is not verified zero.
10. **Monitoring and receipt.** Follow the existing-account
    [Sentry setup/test instructions](analytics-monitoring.md#jamess-existing-account-setup-and-delivery-test).
    Local/manual runs do not check in to the production scheduled monitor.
    Record delivery as pending until a real notification receipt exists. Send
    Cipher the source SHA, non-secret target/source IDs, D, per-step outcomes,
    before/after metric fingerprints, saved import/cursor observations and
    authorization matrix. Exclude secrets, login cookies and user identities.
    Cipher repeats read-only checks, records remaining gaps and then completes
    WU-1212. Six disposable database-writing integration tests remain unrun;
    guarded skips, mocks and manual bounded checks are distinct evidence.

## Production continuation; held for WU-1213

This is a planning sequence, not permission to activate or completed production
validation. After development evidence is accepted:

1. Refresh existing production identity, full catalog/selected ledger state and
   actual recovery coverage independently. The current package is already applied;
   do not rerun 01/076/077. Review 24-hour PITR and unperformed restore/offsite
   backup proof from the monitoring guide. Resolve public-verification and
   credential-maintenance status from fresh non-secret release evidence, not old
   instructions or a hardcoded disabled log.
2. James privately confirms existing production analytics settings/scopes:
   `ANALYTICS_VERCEL_TOKEN`, `ANALYTICS_PROJECT_ID`, optional
   `ANALYTICS_TEAM_ID`, evidence-based `ANALYTICS_AVAILABLE_FROM`,
   `ANALYTICS_SYNC_ENABLED` and `CRON_SECRET`. Do not retrieve or post values.
   Leave database URLs/Neon resources unchanged. Resolve pooled/unknown runtime
   incompatibility before enabling; current metadata alone is insufficient.
3. Review the exact source SHA, manual dev/prod readiness references and original
   hashes in `releases/analytics-state.json`, including the production target
   fingerprint and acknowledgement that an enabled staged deployment has the
   enabled runtime value already. The prepared record remains off until a real
   owner-reviewed activation change. Follow the existing exact-SHA trusted CI,
   dispatcher and human `production-release` approval; no second workflow/gate
   or agent migration executor. No production dispatch is authorized by this plan.
4. After James's approved configuration/release, require read-only staged/public
   state to match the approved revision, flag, direct target and schema/ledger.
   James performs first-day/repeat and bounded import controls; Cipher reconciles
   read-only just as above. Observe the actual 09:17 UTC scheduler invocation and
   Sentry check-in, then notification/recovery evidence. Never call Cron to
   manufacture scheduled proof. Establish supported history and record gaps.
5. James can disable future collection through the approved runtime setting and
   release, verify observed off, and pause the external monitor. Retain archive
   tables and report access; do not delete data, restore or replay migrations.

Production is not ready to be declared complete while development, token
transport, public acceptance, credential status, monitoring delivery or the real
scheduled run lacks evidence. No ticket is closed on the strength of this plan.
