---
name: database-migrations
description: Add or review tullyelly domain SQL migrations, view changes, and idempotent backfills.
---

# Database Migrations

Read [required context](../../../docs/database.md) and the relevant procedures in the
[docs index](../../../docs/README.md).

Inspect related migrations, schema consumers, and migration tests. Add numbered migrations without editing applied history; resolve IDs by stable keys and use non-destructive merges. Follow the migration ledger procedure and existing PL/pgSQL style. Check transactions, audit behavior, dependent views, and Next cache freshness. Run meaningful migration/static tests and the baseline. Verify the safe target before authorized non-production status/apply/verify operations; distinguish static tests from live application. This skill does not authorize production writes.

Verification is owned by [validation](../../../docs/validation.md); follow its
baseline and applicable additional checks.
