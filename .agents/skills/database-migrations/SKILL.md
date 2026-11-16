---
name: database-migrations
description: Prepare or review tullyelly database mutations, including schema, data-only changes, backfills, repairs, grants, functions, triggers, constraints and migration-ledger maintenance, with James-operated DataGrip handoffs.
---

Read [database boundaries](../../../docs/database.md), the owning
[two-file procedure](../../../docs/manual-migrations.md), migration history and
validation guidance. Inspect implementation and both live targets read-only.
Check whether a migration is applied before editing; preserve applied history.

James's normal DataGrip process is exactly two complete files:

1. Run the canonical numbered migration, with essential prerequisites, locks and
   effect/preservation assertions inside its transaction.
2. Only after success, run the separate ledger file. It checks effects/conflicts
   and records the canonical filename and finalized SHA-256; it never replays SQL.

Repeat development then approved production. Stop on either failure. Roll back a
failed migration and do not run its ledger file. If migration succeeds but ledger
recording fails, repair the ledger problem without automatically rerunning the
migration. Investigate uncertain commits read-only. Preserve matching history and
stop on conflicts; never repair unrelated historical gaps.

Cipher prepares and validates the two files, hashes and release compatibility
artifacts within the read-only database boundary. No agent migration/status/verify,
seed, fixture, cleanup, auth/session or collection writes; no new/reset branches,
connections, environment edits or credential retrieval. James owns SQL writes.

Embed essential safeguards in the executable files. Do not add wrappers, separate
pre/postflight, fixtures, multiple consoles or cleanup to the normal checklist.
Optional engineering tests/diagnostics stay separate and are labelled unrun when
write-producing. Follow the [short template](../../../docs/templates/manual-migration-handoff.md).
Keep the final response to a brief change summary, the two exact files in order,
and actual blockers. Prepared, applied, verified and deployed remain distinct.
Release compatibility requires current evidence and the complete guarded diff;
ledger recording alone does not clear the application release guard.
