# Database boundaries

Prefer parameterized sql tagged templates from `@/lib/db`; use queryRows/queryOne
for dynamic query text with separate bound values. Never interpolate untrusted
identifiers. Prisma is only for NextAuth's auth schema, not domain migrations.

Use getPool from `@/db/pool` when a transaction, dedicated connection, or LISTEN
needs a raw client. A transaction must use one connected client for BEGIN, all
queries, COMMIT or ROLLBACK, and release in finally; independent sql calls are
not one transaction. See [snapshot handler](../app/api/tcdb/snapshot/route.ts).

[lib/db.ts](../lib/db.ts) blocks build-time reads.
[db/pool.ts](../db/pool.ts) checks local SKIP_DB and E2E_MODE before constructing
a real pool; the E2E pool only implements limited Scrolls/release-type reads and
returns empty rows for other queries. It is not an authz or domain DB substitute.
[Escape hatches](escape-hatches.md) explains production guards. Preserve URL
normalization and safety in db/assert-database-url.ts and migration safety checks.
Runtime fallback behavior must not hide unauthorized writes or build-time queries.

[Migrations](migrations.md) owns the ledger procedure. Confirm the intended
non-production target before running scripts; even status/verify initialize the
ledger. Static tests do not prove a migration was applied to any database.

## Audit events

[lib/audit/log.ts](../lib/audit/log.ts) writes action, actor_user_id, feature_key,
effect, and meta to dojo.audit_log. feature_key currently equals action and effect
is success. target_table and target_id are merged into meta, not standalone
columns; ts defaults in the database. The schema is
[migration 066](../db/migrations/066_create_audit_log.sql).
The helper does not populate target_user_id, request_id, or ip and does not
implement the old spike's retention proposal.
