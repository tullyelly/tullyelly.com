---
name: database-migrations
description: Prepare or review tullyelly database mutations, including schema, data-only changes, backfills, repairs, grants, functions, triggers, constraints and migration-ledger maintenance, with James-operated DataGrip handoffs.
---

Read [database boundaries](../../../docs/database.md), the owning
[manual procedure](../../../docs/manual-migrations.md), [migration history](../../../docs/migrations.md)
and [validation](../../../docs/validation.md). Inspect implementation, dependent
views, audit/inference triggers and consumers before proposing SQL.

James executes all writes in existing DataGrip development first, then production
after validation, fresh preflight and the required concrete human approval.
Cipher and every delegated agent remain read-only through every route. Do not run
migration executors, status/verify (they initialize the ledger), seeds, fixtures,
cleanup, authentication writes or collection/import. No new/reset Neon branches,
connections, environment edits or credential retrieval.

Prepare new canonical numbered SQL without changing applied history. Supply
read-only preflight, complete atomic apply-with-ledger script where possible,
required effect assertions, read-only postflight, human-operated development
checks and a task handoff using [the template](../../../docs/templates/manual-migration-handoff.md).
Use the offline generator/validator for reproducible canonical checksum/body and
ledger binding. Keep operational files outside numbered migrations. Require
exact-file evidence before conditional reconciliation; installed effects alone
are insufficient. Preserve matching history; stop on conflicts or uncertainty.

Every final response must name exact execution files in ordered dev-then-prod
tables, identify the ledger writer and review-only/conditional files, and state
what remains before deployment. Assess running-app compatibility and the complete
guarded release diff against a verified live baseline. Prepared, applied,
verified and deployed are separate states. Read-only SQL and safe mocked checks
never establish live application. Do not manufacture release compatibility proof.
