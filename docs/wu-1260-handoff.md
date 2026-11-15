# WU-1260 migration handoff

## Current checkpoint; WU-1263

WU-1261 cleanup and WU-1262 decisions are Done. Fresh independent read-only
inspection on November 15 confirms 098 and 099 applied/recorded in both existing
targets with matching canonical checksums. Preserve both applied files. WU-1263
is In Progress; migration 100 and its separate ledger are prepared, unapplied.
[The typed relationship contract and current handoff](typed-tag-relationships.md)
own the exact development-first files, expected result and remaining evidence.
WU-1264 through WU-1268 wait at James's manual database execution boundary.
No merge, deployment or later-story completion is claimed.

## Historical 098 preparation and execution corrections

The dated records below predate reported execution and the current checkpoint.
Do not rerun 098 or reopen the accepted WU-1262 decisions from these older notes.

Shared branch: `epic/WU-1260-tag-relationships`. WU-1270 now uses the two-file
procedure in [manual migrations](manual-migrations.md). The previous wrapper and
13-step checklist are retired. No database writes or production deployment occurred.

## Normal execution

Run the complete files in order in existing development, then approved production:

1. `db/migrations/098_protect_homie_tag_identity.sql`
2. `db/operations/098_record_applied.sql`, only after the migration succeeds.

Stop if either fails. Roll back a failed migration transaction and do not run the
ledger file. If migration succeeds but recording fails, fix the ledger problem
without automatically replaying migration 098. Investigate uncertain commits
read-only. The second file checks effects/definitions and conflict protection,
then records the canonical filename/SHA-256 in `dojo.schema_migration`.

The migration contains required prerequisites, preservation checks and effect
assertions in one transaction. Existing cleanup, synchronization and collision
protection are retained. There is no normal preflight/postflight, fixture,
multiple-console or cleanup checklist. Files under `db/tests/098*` are optional
engineering tools, not instructions James must execute to apply the migration.

## Engineering evidence and release preparation

Fresh read-only inspection on November 15, 2026 found no 098 ledger record or any
of its new functions in either existing development or production. Family tag
33 still had the old homie kind and tag 274 still had the athlete label. Thus 098
was not applied before this in-place revision. Earlier migrations remain unchanged.
The older [observations](evidence/wu-1261-readonly-observations.json) remain dated
context. Prepared does not mean applied, verified or deployed.

The generated `db/operations/098_record_applied.json` pins finalized canonical and
ledger hashes. Cipher runs `node scripts/prepare-homie-identity-package.mjs check`
and safe automated/static checks. The generator derives ledger effect/definition
checks from the canonical source; it does not execute SQL. Database-writing
behavior/concurrency tests remain unrun under the agent read-only boundary.

Current application columns/routes and READ COMMITTED writer behavior are
unchanged by this process correction. [The feature contract](homie-tag-synchronization.md)
records the existing synchronization limits. Cipher owns read-only verification
and application release compatibility preparation after reported SQL execution.
The complete guarded diff must use a verified live production application baseline,
including earlier unreleased changes. Existing `releases/deferred-schema.json`
contains an older review and is not evidence for revised 098. Fresh Vercel alias inspection
returned scope 403; authorized baseline verification and actual execution
evidence remain necessary before refreshing release compatibility. No stale
baseline, applied status or release approval is invented.

At that earlier checkpoint WU-1262 had not begun; its decisions are now accepted.

## Development execution correction

James reported the original trigger-definition guard failing before cleanup.
Read-only inspection confirmed no 098 ledger/functions in either environment.
The same live trigger renders differently when dojo is visible on search_path;
this caused a false fingerprint mismatch in DataGrip. Migration 098 now sets
transaction-local search_path to pg_catalog before catalog comparisons. The
setting ends with the transaction; schema-qualified feature behavior is unchanged.
Cipher reproduced the mismatch and canonical-path correction read-only, then
regenerated the separate ledger checksum. After ROLLBACK of the failed console,
James uses the current complete migration, then the current ledger only on success.

The next development attempt reached the final preservation assertion and failed
because JSON extraction was not parenthesized before key subtraction. The fix
groups each `#>` extraction before `-`; it does not remove preservation checks.
Cipher ran the exact corrected preservation block read-only with CTE snapshots
and simulated intended cleanup in both databases, including a negative case that
must reject unrelated JSON drift. Nine safe tests passed; the separate ledger
checksum was regenerated. No committed 098 functions or ledger rows were observed.
James must roll back the failed console before retrying the current complete files.
