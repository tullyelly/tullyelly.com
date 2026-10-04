# Authorization feature workflow

Read the [contract](AUTHZ-CONTRACT.md), [database](../database.md), and
[migration procedure](../migrations.md) before changing permissions.

1. Identify server entry points, existing feature keys, app scope, roles, and
   allow/deny expectations. Search migrations and consumers; do not assume the
   archived seed matrix is deployed.
2. Add a numbered migration resolving app/role/feature IDs by stable keys, using
   explicit grants and idempotent inserts where appropriate. Avoid hardcoded IDs.
3. For memberships prefer admin grantRole/revokeRole actions and guarded SQL
   functions. NULL app slug means global. Never replace them with raw membership
   writes that omit revision bumps and notification.
4. For role-feature or enabled changes, determine every affected global/scoped
   member and bump revisions plus notify in the same transaction. Follow
   [migration 065](../../db/migrations/065_add_homie_update_authorization.sql).
   Invalidate corresponding Next tags after commit using the context's existing API.
5. Enforce must with strict:true at privileged server boundaries. Reuse permission
   wrappers when they fit; keep UI and menu hints aligned without treating them
   as enforcement. Preserve self-lockout safeguards.
6. Test unauthenticated, denied, disabled, unknown, allow/deny conflict, app scope,
   stale revision, and affected mutation/invalidation behavior as relevant.
   Representative tests are linked in the contract; run the required baseline
   from [validation](../validation.md).
7. Verify memberships/revisions on an authorized non-production target; report
   separately whether migrations ran. Review docs with the changed behavior.

Removing a grant/feature also requires freshness handling; prefer a follow-up
migration over rewriting applied history. No procedure here authorizes a
production write or a new user membership assignment.
