# Manual database change preparation

This is the owning procedure for all future database mutation preparation,
including data-only migrations, repair/grant/function/trigger/constraint changes
and ledger maintenance. James operates existing DataGrip connections; Cipher
prepares and inspects read-only. Development precedes production. Production
requires the concrete reviewed SQL scope and human approval under
[production releases](production-releases.md). Nothing here authorizes a write,
changes a connection, initializes a ledger, or dispatches a migration executor.
Runner status/verify initialize objects; agents must not run them.

## Normal package and execution

1. Inspect each target independently in explicit read-only transactions. Record
   non-secret target identity, catalog prerequisites, current effects, triggers,
   relevant rows and ledger presence/shape/conflicts. Do not retrieve credentials.
2. Add the next unused canonical numbered migration under `db/migrations`.
   Preserve applied history. Use one outer BEGIN/COMMIT and schema-qualified SQL.
   Include transaction locks, preservation and effect assertions appropriate to
   the task. Supply separate transaction-free assertion SQL for operation reruns.
3. Prepare `db/operations/NNN_*_preflight.sql`, the complete
   `NNN_apply_with_ledger.sql`, `NNN_*_postflight.sql`, human development checks
   under `db/tests`, and a task-specific handoff using the
   [template](templates/manual-migration-handoff.md). Only canonical migrations
   belong in the runner's numbered directory.
4. Finalize canonical and assertions first. Generate the atomic operation offline:

   ```sh
   node scripts/manual-migration.mjs generate db/migrations/NNN_name.sql db/operations/NNN_assertions.sql db/operations/NNN_apply_with_ledger.sql
   node scripts/manual-migration.mjs check db/migrations/NNN_name.sql db/operations/NNN_assertions.sql db/operations/NNN_apply_with_ledger.sql
   ```

   These illustrative NNN paths are placeholders, not executable task instructions.
   The generator does not load environment files or connect to a database. It
   strips exactly one outer transaction, embeds the body faithfully, runs required
   assertions and records the canonical filename/SHA-256 in one transaction. It
   rejects unsupported transaction shapes, psql commands and obvious operations
   requiring a nontransactional plan. Review SQL semantics independently.
   The adjacent JSON records hashes for canonical UTF-8 bytes, assertions and
   operation. This matches `calculateMigrationChecksum` in
   [the runner](../db/schema-migrations.ts), not a hash of the wrapper. Any change
   requires regeneration, re-review and refreshed dependent evidence. Run `check`
   against finalized files before handoff; never edit generated SQL manually.

5. James reviews revision/hashes and runs the preflight in existing development.
   James runs the complete atomic operation, then restores read-only mode and
   runs postflight. **The canonical migration is review/provenance only; never
   run both the canonical file and the atomic operation.** The operation includes
   `dojo.schema_migration`; no separate ledger SQL is required on the normal path.
6. James runs the supplied development write tests and application checks; Cipher
   verifies results read-only. Only then refresh production preflight and approval
   and repeat the normal operation/postflight there. Do not run write fixtures in
   production. Keep sanitized execution receipts and exact revision/hash evidence.

The bundle uses the existing `cipher:schema-migrations` advisory lock namespace
with `hashtextextended(..., 0)` and locks the ledger. Coordinate all SQL operators;
the legacy runner does not honor this advisory lock. Task-specific table/row locks
and statement limits must still be reviewed. Existing valid applied entries are
left unchanged and the body is skipped, but effect assertions still run. Failed,
conflicting filename/number/checksum/algorithm or malformed history stops. A
matching record plus changed effects requires investigation, not replay. On an
error roll back the open transaction. Lost commit acknowledgement means inspect
effects and ledger read-only before any retry; never assume nothing committed.

## Conditional paths

- Missing ledger: only if fresh preflight proves absence, prepare a separately
  reviewed initialization file using the exact `ensureMigrationLedger` table,
  constraint and index contract. James executes it before the operation. Do not
  create it preemptively or initialize through runner status/verify.
- Already executed canonical file without recording: only confirmed execution of
  the exact bytes plus successful postflight permits a task-specific
  `*_record_applied.sql`. Installed data/schema alone cannot prove exact-file
  execution. `manual-migration.mjs reconcile CANONICAL ASSERTIONS OPERATION
EXACT_EXECUTION_REFERENCE` generates a guarded reconciliation operation without
  replaying the body. Its evidence must name the actual receipt, revision, hash
  and successful postflight. Review evidence manually; the generator cannot prove
  it. Matching valid history stays unchanged; conflicts fail. Do not bulk-baseline
  historical files, overwrite applied hashes or repair unrelated gaps.
- Nontransactional SQL: stop using the generator and explain the requirement.
  Supply exact staged operations, per-stage verification, ledger timing only
  after every required effect passes, partial-failure recovery and uncertain-commit
  handling. Do not wrap an internal COMMIT in another transaction or claim atomicity.

## Deployment readiness is separate

Trace [prepare-evidence](../scripts/release/prepare-evidence.ts),
[native-evidence](../scripts/release/native-evidence.ts) and
[schema-deferral](../scripts/release/schema-deferral.ts). The production pipeline
uses verified production aliases/deployment application SHA as its baseline and
compares the release candidate to that baseline. `db/migrations`, `db/schema` and
`prisma/schema*` changes can trigger compatibility review after SQL is applied.
A `dojo.schema_migration` row does not satisfy that separate guard.

When applicable, prepare `releases/deferred-schema.json` only with an actual
reviewed application-release scope, verified live baseline and the complete
unreleased guarded diff, including earlier work. Use the exact binary/full-index,
no-renames, Myers diff flags and pathspec from `readSchemaDeferral`; its SHA-256
and baseline must match. Changed SQL or baseline invalidates the record. Rationale
must distinguish prepared files, James-reported execution, read-only observations
and outstanding checks. Recheck baseline and full diff during release preparation.
This process chore does not create a release record or change release machinery.

Each task states whether SQL precedes deployment, may follow it, or requires
staging, and why the currently running app remains compatible. Never infer readiness
or deployment from prepared SQL or a commit. List unrun integration/recovery checks
and actual backup coverage/accepted limitations; do not invent restore proof or
require a new recovery environment. Cipher must refresh postflight, canonical
ledger records and release evidence after James's execution. Existing protected
human application approvals and main stability controls remain intact.

## Required final report

The checked-in task handoff and final response both include the exact ordered
execution table, reviewed revision, finalized hashes, which file writes which
ledger, normal/conditional/review-only files, passed/failed/unrun checks, required
human steps, deployment timing and James's immediate next action. A generic link
alone is insufficient. With no SQL deliverable say “No manual SQL execution
required.” Prepared must never imply applied or deployed.

## Illustrative future handoff; do not execute

The following fictitious files do not exist and authorize no SQL. A future task
replaces them with real reviewed files and hashes. WU-1270 itself requires no
manual SQL execution.

| Order | Environment               | Exact file or command                      | Purpose                                                  | Expected result                         | Stop if                     |
| ----- | ------------------------- | ------------------------------------------ | -------------------------------------------------------- | --------------------------------------- | --------------------------- |
| 1     | Development, read-only    | `db/operations/999_example_preflight.sql`  | Check target and history                                 | All task prerequisites match            | Drift or ambiguity          |
| 2     | Development, James writes | `db/operations/999_apply_with_ledger.sql`  | Apply effects and `dojo.schema_migration` atomically     | Commit with canonical 999 filename/hash | Any error or unknown commit |
| 3     | Development, read-only    | `db/operations/999_example_postflight.sql` | Check effects and ledger                                 | All assertions pass                     | Any mismatch                |
| 4     | Development, James writes | `db/tests/999_example_test.sql`            | Human behavior checks                                    | Every case passes                       | Any failure                 |
| 5     | Production prerequisite   | `db/operations/999_example_preflight.sql`  | Fresh read-only checks after dev validation and approval | Reviewed target/current state           | Missing evidence/approval   |
| 6     | Production, James writes  | `db/operations/999_apply_with_ledger.sql`  | Apply same reviewed operation and ledger                 | Atomic commit                           | Error or unknown commit     |
| 7     | Production, read-only     | `db/operations/999_example_postflight.sql` | Verify exact effects/history                             | All checks pass                         | Any mismatch                |

`db/migrations/999_example.sql` would be review-only on this path. Ledger SQL is
already included in the atomic operation. Conditional initialization or
`999_record_applied.sql` would only be supplied on the evidence-backed paths above.
The real task must state deployment ordering and live baseline/full-diff evidence;
this example supplies neither. Immediate action for WU-1270: continue to the
explicitly authorized WU-1261 preparation; do not execute these example paths.
