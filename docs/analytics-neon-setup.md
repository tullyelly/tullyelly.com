# Analytics: reviewed DataGrip migration operations

The owner operates DataGrip for individually reviewed SQL files. This procedure
resolves the older setup guide's contradictory “manual is historical” banner:
manual execution is supported, but never bypasses the existing production review,
concrete release approval and human protected gate in
[production releases](production-releases.md). Application deployment stays on
that workflow. This document authorizes no writes; the 2026-10-29 refresh was
read-only. [Current observations](analytics-rollout.md#observed-on-2026-10-29)
are separate from unverified deployed configuration.

## Prerequisites and stop conditions

1. Bind the review to an immutable checkout SHA, selected filenames in order,
   exact SHA-256 values, target project/branch/direct endpoint/database/role,
   expected effects, compatibility, execution owner and recovery evidence. Obtain
   the existing production approval before any production mutation, including
   ledger initialization or baseline inserts. Do not run another migration
   executor concurrently or dispatch the analytics workflow to repeat manual work.
2. Privately match DataGrip's Host field to current Neon endpoint metadata and
   the owner-confirmed deployed database binding. Database/role names alone do
   not identify a branch. Use a dedicated labeled connection, direct TLS endpoint
   and approved application role; do not copy MCP's `neondb_owner` identity or
   substitute `neondb/neondb_owner` to evade application guards. Never share URLs,
   passwords or tokens. Leave existing local environment files untouched.
3. Keep DataGrip read-only for assessment. Run
   [analytics-schema.sql](../db/diagnostics/analytics-schema.sql) in its explicit
   READ ONLY transaction. Confirm database, role and read_only=`on`; inspect
   columns, validated constraints, indexes, owners, functions and triggers.
   Only if ledger presence is non-null, run
   [analytics-ledger.sql](../db/diagnostics/analytics-ledger.sql).
   Neither initializes the ledger. Runner status/verify are not read-only:
   `loadMigrationStatus` calls `ensureMigrationLedger`.
4. Rehearse the exact reviewed files and ledger plan on a freshly verified
   isolated target with representative prerequisites. The old `dev/analytics`
   IDs and test passes are historical; no such branch was returned on 2026-10-29.
   Creating/replacing a branch needs separate authorization. Use the existing
   `scripts/analytics-test-preflight.ts` and
   `__tests__/analytics-postgres.integration.test.ts` only after verifying their
   explicit target metadata and opt-in guards. Those tests write fixtures;
   they are not production postflight or live API proof.
5. Confirm collection is disabled using current deployment-bound evidence before
   writes. Review a retained recovery checkpoint, actual retention window and a
   successful isolated restore rehearsal with an owner and expiry window. Never
   test recovery by restoring/resetting production. Missing/expired recovery,
   identity mismatch, partial schema, failed ledger entries or checksum drift stop
   execution. No automatic reverse migrations or retries after uncertain commits.

## Exact files and prerequisite review

These are SHA-256 values of the unchanged repository files at the inspected SHA:

| File                               | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `076_create_analytics_archive.sql` | `0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553` |
| `077_analytics_operations.sql`     | `88584aa867075149dc0b7d1b984262443462493c0e446fb8c00122446128f694` |

Recompute from the approved checkout before execution; preserve exact bytes and
line endings. Hash each selected file, never a bulk baseline list:

```bash
sha256sum db/migrations/076_create_analytics_archive.sql db/migrations/077_analytics_operations.sql
```

076 requires `dojo`, `tullyelly_admin` and all five analytics tables genuinely
absent. Any existing subset requires investigation. Verify its five tables,
BIGINT counts, identities, primary/foreign keys, check constraints and owners
against the file after application. 077 requires verified 076, absent operational
columns/constraint, authorization tables, admin app/role, revision function and
reviewed feature/grant state. Its conflict handling can preserve existing rows;
check correctness, not just existence. It adds no memberships, but bumps revisions
and emits authz notifications for affected users. Review those effects explicitly.

## Existing history and ledger handling

Use the existing `dojo.schema_migration` definition and semantics from
[db/schema-migrations.ts](../db/schema-migrations.ts); do not create a second ledger.
If absent, separately review its exact `ensureMigrationLedger` DDL and index as
part of the approved operation. Do not initialize it through status by accident.
Inspect an existing ledger's shape before using it.

For each relevant file record filename, exact hash, ledger state, schema and
data-effect evidence, classification, proposed action, reviewer and time:

| State                                                | Required decision                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Applied and exact checksum/algorithm match           | Verify effects and prerequisites; leave the row unchanged                  |
| Existing effects without ledger proof                | Review every effect or explicitly approve a documented equivalent baseline |
| Genuinely pending                                    | Execute only that reviewed file with its exact-hash ledger row             |
| Partial, ambiguous or superseded                     | Stop for investigation and a reviewed forward repair/baseline decision     |
| Failed, unknown ledger filename or checksum mismatch | Stop; never overwrite an applied checksum or relabel failure as success    |

Object existence cannot prove historical seed/update/delete execution. Never
replay 001 onward or bulk-mark files applied to make verification green. A
baseline row uses the exact file hash, `sha256`, `applied`, checkpoint timestamps,
`execution_ms=0` and null error; the review record must state that this is a
reconciliation checkpoint, not the original execution date. Review such inserts
individually, with no conflict overwrite. Unknown history remains unresolved.
The existing analytics executor refuses absent/unreconciled historical ledger
entries, including unrelated pending files; manual work does not waive that guard.

## Owner execution of an approved file

Prepare a private, separately reviewed DataGrip bundle per selected file. Keep
repository migration files unchanged. For 076 and 077, preserve the original
outer BEGIN/COMMIT and SQL body; insert that file's ledger INSERT immediately
before its COMMIT so schema and ledger commit atomically. Include approved local
lock/statement timeouts. Do not wrap a file containing COMMIT in another BEGIN:
that would not provide atomicity. Review both the original file hash and bundle
hash in the execution record; ledger checksum identifies the original file.

On the same dedicated direct session, coordinate with the existing release lock:
`pg_try_advisory_lock(hashtextextended('cipher:schema-migrations', 0))`.
Proceed only on true; retain that session through execution and release the lock
on completion. No apply-all runner or other SQL operator may run concurrently;
the legacy runner does not itself honor this release lock.

At the approved window, the owner deliberately permits writes on this connection,
rechecks target/prerequisites and absence of a ledger row, then executes one entire
reviewed bundle, stopping on the first error. The ledger INSERT must name only
that file, its exact SHA-256, algorithm `sha256`, status `applied`, non-null applied
and attempted timestamps, measured execution duration and null error. Do not use
ON CONFLICT to conceal an existing row. If execution fails, roll back any open
transaction; if commit acknowledgement is lost, inspect schema and ledger before
any retry. Earlier committed files remain applied. Never infer failure means
nothing changed.

## Read-only postflight

Restore DataGrip's read-only setting and run the explicit read-only catalog and
ledger diagnostic files again. Compare each selected ledger row's filename,
checksum, algorithm, applied status and timestamps to the reviewed originals.
Compare actual columns, validated constraints, indexes and ownership against
076/077 and `scripts/release-db-schema.json`. Check the admin feature's app and
enabled state, allow grant, preserved deny grants/memberships and revision
function/notification definitions. Catalog existence alone does not prove revision
invalidation was exercised; retain that distinction from rehearsal evidence.

Do not run rollback-only SQL fixtures, collector actions or runner status/verify
as read-only production checks. Preserve sanitized before/after evidence and the
owner's execution record. A matching selected ledger row does not reconcile all
historical files. Do not claim global verification while history is unresolved.
Application release and later collection activation retain their existing separate
approvals. No database migration runs during builds or startup.

The [October setup archive](archive/analytics-october-setup.md) preserves the old
local environment handoff and recovery sequence solely as historical context.
