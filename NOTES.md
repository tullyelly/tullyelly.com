# Snapshot API Primitives Inventory

## AuthZ helpers

- `lib/authz/index.ts` exports `can`, `must`, `canCurrentUser`, and `mustCurrentUser`; all backed by `getEffectivePolicy`.
- `lib/authz/resolve.ts` builds effective policies via `unstable_cache` with tag `auth:user:{id}`; invalidation uses `revalidateTag`.
- `components/auth/AuthzGate.tsx` calls `must(user, feature, { strict: true })` for server components.
- `app/admin/authz/actions.ts` is the current server action surface; it calls `must(actor, 'admin.membership.manage', { strict: true })` and revalidates auth tags after mutations.
- `lib/auth/permissions.ts` (added) exports `requirePermission(feature)` and `requireTcdbSnapshotCreate()` which wraps `mustCurrentUser('tcdb.snapshot.create')` with strict enforcement.

## DB access primitives

- `lib/db.ts` exports the `sql` tagged template helper; it relies on `@/db/pool` for connections.
- `db/pool.ts` exposes `getPool()` which returns a singleton `pg.Pool`; it supports LISTEN based invalidation and an in memory pool for E2E mode.
- `lib/pool.ts` (unused today) wraps `pg.Pool` and exports a `tx` helper if we need a typed PoolClient helper outside the shared pool.
- Transaction pattern for Snapshot API work will use `getPool()` with an explicit connection:
  ```ts
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // ...work inside the transaction...
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  ```

## Audit logging surface

- Existing schema reference lives in `docs/authz/SCHEMA-DRAFT.md`; it describes `dojo.audit_log` with `action`, `actor_user_id`, `feature_key`, `effect`, `meta`, and timestamps.
- `lib/audit/log.ts` (added) exports `writeAudit({ action, actorId, targetTable, targetId, metadata })`; it inserts into `dojo.audit_log` and serializes metadata to JSON.
- Fields to populate for Snapshot API: `action`, `actor_id`, `target_table`, `target_id`, `metadata`, `created_at` (defaults to NOW()).

## Cache tags and revalidation

- `lib/authz/resolve.ts` registers cache tag `auth:user:{id}` and relies on `revalidateTag` for policy busting.
- `lib/authz/invalidation.ts` subscribes to the `authz_changed` channel and calls `revalidateTag('auth:user:${id}')`.
- `app/admin/authz/actions.ts` revalidates `auth:user:${userId}` after role grant or revoke.
- `app/api/revalidate/tcdb-rankings/route.ts` confirms the rankings tag is `'tcdb-rankings'`.
- All code imports `revalidateTag` from `next/cache`.

## Gaps addressed

- Added `lib/auth/permissions.ts` for Snapshot specific permission gating.
- Added `lib/audit/log.ts` to centralize audit writes pending the Snapshot API work.
