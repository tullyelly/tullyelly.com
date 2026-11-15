# WU-1260 migration handoff

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

WU-1262 remains the next planning checkpoint; no decisions or later stories began.
