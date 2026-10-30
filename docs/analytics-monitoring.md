# Analytics monitoring and recovery; WU-1211

This is implementation and an owner-operated setup handoff. No dashboard setup,
notification delivery, collection, restore or deployment was performed by Cipher.
Existing application release and manual DataGrip ownership remain unchanged.

## Three independent conditions

| Condition                                 | Evidence and response                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution failure                         | An authenticated enabled production Cron starts a Sentry `in_progress` check-in; a controlled failure or thrown operation ends that same ID as `error`. Fixed log condition: `execution_failure`. Existing sanitized exceptions remain diagnostic evidence.                                                                         |
| Missing invocation or process termination | The external Sentry monitor detects no start within its grace period, or a start with no terminal check-in within maximum runtime. Application code cannot report an invocation that never arrived. Anonymous 401 probes, private page reads and manual imports send no check-ins.                                                  |
| Stale daily data after execution          | A successful/bounded operation must leave yesterday's `complete`/`zero` row tied to a finished `daily` run started during this invocation. Otherwise the same check-in ends `error`, with fixed log condition `stale_data`. An older archived row or backfill cannot satisfy this check. A database read failure also fails closed. |

The 36-hour owner-console badge separately measures the last completed daily run;
it does not prove scheduled invocation or send a notification. Catch-up progress
and older gaps remain visible separately, even when yesterday is fresh. Check-ins
come only from the authenticated Cron route while `ANALYTICS_SYNC_ENABLED=true`
and `VERCEL_ENV=production`; owner Run now/history actions do not check in.
A manual request using the Cron credential can look like a scheduled invocation;
correlate Vercel scheduler logs before claiming real Cron proof.

## James's existing-account setup and delivery test

1. In the existing Sentry project used by `NEXT_PUBLIC_SENTRY_DSN`, confirm Cron
   monitoring capacity, project access and a working notification destination.
   These account prerequisites and current DSN transport are **unverified**.
   Do not send secrets or credentials to chat. No new monitoring service is needed.
2. Create/configure the monitor slug **`analytics-daily`** in that project, with
   crontab **`17 9 * * *`**, timezone **UTC**, check-in margin **15 minutes**, maximum
   runtime **2 minutes**, failure threshold **1**, recovery threshold **1**. Use
   the production environment. Keep it disabled/muted until deliberate activation.
   The application supplies check-ins without a monitor configuration; it neither
   creates nor overwrites dashboard settings. Leave Sentry's experimental automatic
   Vercel Cron instrumentation off for this route to prevent duplicate check-ins.
3. Attach one notification rule for monitor incidents (error, missed and timeout)
   and recovery to your chosen destination. Use Sentry incident grouping and
   notification frequency controls; do not add a second page-view health alert.
   Suppress duplicate paging from generic analytics exception rules; keep those
   exceptions for diagnosis. Do not silence unrelated application errors.
4. Use the dashboard's notification-rule test/preview, if available for your
   account, to deliver a synthetic notification. If unavailable, use Sentry's
   supported existing-project test mechanism with a synthetic message only;
   do not invoke the collector, intentionally fail database work, expose a public
   test endpoint or alter shared development data. Record the destination type,
   UTC receipt time and incident/rule reference without recipient addresses or
   payloads. A preview alone is not delivery proof. Delivery remains pending
   until an actual receipt is recorded.
5. At the approved production activation, enable the monitor before the next
   09:17 UTC tick. Observe its paired start/terminal ID and correlate the Vercel
   scheduled invocation and fixed condition log. A start not received by 09:32 UTC
   should become missed; a start with no finish after two minutes should time out.
   These are vendor behavior expectations, **not live results** from this change.
   Validate actual routing/recovery in your account; do not trigger collection
   merely to test monitoring. Fault and absence paths have mocked coverage only.

The application emits only fixed monitor slug/status, check-in ID and duration.
It does not attach URLs, headers, API responses, database errors, user IDs, paths,
project values or credentials to check-ins. Monitoring transport errors cannot
prevent collection; they can still produce missing/timeout incidents, so SDK
success is not notification proof. An absence test proves the app emits no fake
heartbeat; only the external monitor can establish an actual missed incident.

See the official [Sentry Next.js check-in API](https://docs.sentry.io/platforms/javascript/guides/nextjs/crons/)
and [monitor setup](https://docs.sentry.io/product/monitors-and-alerts/monitors/crons/getting-started/).
The installed SDK already supports paired check-ins; no dependency was added.

## Intentional pause and recovery

James pauses collection using the existing approved analytics runtime setting and
release procedure; archive tables remain intact. Mute/disable the monitor for the
same maintenance interval, record the reason and expiry, and confirm effective
runtime off through the read-only state endpoint. Disabled collection sends no
success heartbeat; leaving the monitor active correctly produces missed alerts.
Turning off error reporting alone does not pause collection.

On recovery, inspect the fixed failure condition, exact deployment/configuration,
read-only schema/ledger checks, owner connection test and saved daily cursor.
James resolves configuration or executes separately reviewed repairs; no automatic
retry, restore, cursor reset, fixture or migration replay is authorized. James can
run the existing bounded daily/import controls after resolving the cause. Resume
the monitor with collection and observe the next real tick. Recovery resolves
only after a healthy check-in; older history gaps still require explicit review.

## Backup coverage and limits

Read-only Neon project metadata refreshed on **2026-10-30 UTC (October 29 local)**
reports `history_retention_seconds=86400` for `rough-bush-94516855`, PostgreSQL 17.
This confirms a configured **24-hour** history window, not an available recovery
checkpoint, successful restore, offsite backup or indefinite protection. Retained
history and actual restore boundaries must be inspected again when needed; the
window advances and cannot recover a loss discovered after coverage expires.

The archive is durable application storage, not an independent backup. No separate
logical backup schedule, independent copy, immutable retention policy, tested
restore, achieved recovery time or recovery-point guarantee was verified. Vercel's
upstream reporting retention is a separate source limit, not backup of the archive.
The earlier 12-month Pro reporting observation does not establish current account
entitlement, exact supported history or recoverability; James confirms those before
selecting `ANALYTICS_AVAILABLE_FROM` or importing history.

For an incident, stop further collection through the approved owner procedure,
retain current evidence, and review provider history/available recovery options
with the owner before a separately authorized recovery plan. Never restore/reset
production automatically. No new Neon branch, snapshot, test target, connection
or restore rehearsal is required or performed for this delivery. Restore validation
remains **unperformed**; limited PITR is an explicitly accepted rollout limitation
until the owner has separately verified broader backup coverage.
