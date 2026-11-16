# Manual database changes

The normal DataGrip workflow is two complete files, in order:

1. Run the canonical `db/migrations/NNN_name.sql`.
2. Only after it succeeds, run `db/operations/NNN_record_applied.sql`.

James repeats those two steps in existing development, then approved production.
If either file fails, stop. Roll back a failed transaction. If the migration
fails, do not run the ledger file. If migration succeeds but ledger recording
fails, investigate and fix ledger recording without automatically replaying the
migration. An uncertain COMMIT requires read-only investigation before retrying.

## Preparation owned by Cipher

Cipher inspects both targets read-only before changing an existing migration.
Preserve applied history; use a follow-up migration if already applied. Never
infer exact-file execution solely from object existence. No runner status/verify,
SQL writes, seeds, fixtures, collection, connection/environment changes or new
Neon branches are permitted for agents. James owns writes and production approval
under [production releases](production-releases.md).

The canonical migration is directly executable in DataGrip with one outer
BEGIN/COMMIT where PostgreSQL permits it. Put necessary target/prerequisite and
history checks, locks, cleanup and effect/preservation assertions inside that
transaction. Do not require a wrapper, psql includes, separate preflight,
postflight, fixtures, multiple consoles or cleanup exercises in the normal path.
For genuinely nontransactional operations explain the actual exception before
handoff; never disguise partial commits as one atomic migration.

The separate ledger file checks target identity, required effects and installed
definitions as appropriate, then records the canonical filename and finalized
SHA-256 in `dojo.schema_migration` within its own transaction. It must never apply
the migration body. Preserve matching valid history; stop on conflicting numbers,
checksums, algorithms, failed/ambiguous entries or uncertain execution. Do not
repair unrelated historical gaps or bulk-baseline files. Only prepare missing
ledger initialization if current inspection establishes it is necessary; include
that reviewed prerequisite within the two-file delivery rather than adding a
routine third file. Initialization must match `ensureMigrationLedger` exactly.

Finalize canonical SQL before generating ledger checksums. The offline helper:

```sh
node scripts/manual-migration.mjs generate db/migrations/NNN_name.sql ASSERTIONS_SOURCE db/operations/NNN_record_applied.sql
node scripts/manual-migration.mjs check db/migrations/NNN_name.sql ASSERTIONS_SOURCE db/operations/NNN_record_applied.sql
```

These paths are illustrative. ASSERTIONS_SOURCE is engineering input embedded in
the ledger, not another file James executes. The adjacent JSON binds canonical,
assertion and ledger hashes. Regenerate dependent files when unapplied SQL changes.
Checksums match [the existing runner](../db/schema-migrations.ts), not a wrapper
hash. Keep operational files outside the numbered migration directory.

Cipher handles safe automated/static/mocked checks, read-only observations and
repository release compatibility preparation. Optional engineering diagnostics
and human-operated write/concurrency tests may remain available but are not the
normal manual checklist. Clearly label unrun database tests; do not claim live
behavior or application from static checks.

## Deployment compatibility and reporting

A ledger record does not clear the separate application compatibility guard.
Follow [schema-deferral](../scripts/release/schema-deferral.ts),
[native-evidence](../scripts/release/native-evidence.ts) and
[prepare-evidence](../scripts/release/prepare-evidence.ts). Verify the live production
application baseline and complete guarded diff, including earlier unreleased
`db/migrations`, `db/schema` and `prisma/schema*` changes. Refresh reviewed evidence
at actual release preparation; changes to source or baseline invalidate it. Do not
invent execution evidence or rewrite a compatibility record without current facts
and an actual release scope. Keep protected approval and main stability controls.

Use [the handoff template](templates/manual-migration-handoff.md). Name only the
two files in normal execution instructions, identify which writes the ledger,
and state the failure rule and actual blockers briefly. Keep hashes, engineering
validation and compatibility limitations in the checked-in handoff. Prepared,
applied, verified and deployed are separate states. If no SQL is needed, say
“No manual SQL execution required.”
