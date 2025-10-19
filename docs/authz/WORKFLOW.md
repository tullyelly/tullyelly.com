# WORKFLOW ; Authz Feature Lifecycle

## When to Use

Follow this playbook whenever you need to put a new capability behind the authorization layer; it keeps features, grants, and memberships in sync with the caching rules in `@/lib/authz`.

## Naming Conventions

- Feature keys follow `{app}.{area}.{verb}` in lowercase; keep segments short and verbs in present tense (for example `tcdb.snapshot.create`).
- Apps map to `dojo.authz_app.slug`; prefer single words or well known abbreviations.
- Roles stay singular and lowercase (`viewer`, `editor`, `admin`); create a new role only when several features travel together.
- Descriptions are sentence case; keep them short so the admin UI remains readable.

## Step 1 ; Add the Feature

1. Extend the capabilities docs (`docs/authz/CAPABILITIES.md`) so the catalogue never drifts.
2. Ship a migration that inserts the feature under the right app:

```sql
WITH app AS (
  SELECT id FROM dojo.authz_app WHERE slug = 'tcdb'
)
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT app.id, 'tcdb.snapshot.view', 'view snapshot history', TRUE
FROM app
ON CONFLICT (key) DO NOTHING;
```

3. If the feature should launch disabled, set `enabled` to FALSE and plan the enable step separately.

## Step 2 ; Grant the Feature to a Role

1. Decide whether the role gets an allow or deny grant; deny wins during evaluation.
2. Update the migration (or add a follow up) so the role relationship is explicit:

```sql
WITH role_ref AS (
  SELECT id FROM dojo.authz_role WHERE name = 'editor'
), feature_ref AS (
  SELECT id FROM dojo.authz_feature WHERE key = 'tcdb.snapshot.view'
)
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT role_ref.id, feature_ref.id, 'allow'
FROM role_ref, feature_ref
ON CONFLICT (role_id, feature_id) DO NOTHING;
```

3. Refresh `docs/authz/CAPABILITIES.md` if the role matrix changes.

## Step 3 ; Assign the Role to a User

1. Prefer the server action helpers (`dojo.authz_grant_role` via `app/mark2/admin/authz`) so revision bumps and cache invalidation happen automatically.
2. For migrations or manual backfills, call the function directly; it enforces `admin.membership.manage` and notifies the Next.js cache:

```sql
SELECT dojo.authz_grant_role(
  '00000000-0000-0000-0000-000000000000'::uuid, -- actor
  '11111111-1111-1111-1111-111111111111'::uuid, -- target user
  'editor',
  NULL -- app slug (NULL = global grant)
);
```

3. Never mutate `dojo.authz_user_app_role` with raw INSERT or DELETE unless you also call `dojo.authz_bump_revision` and `pg_notify('authz_changed', ...)` yourself.

## Verification Checklist

- View `dojo.v_authz_memberships` to confirm the role shows up with the expected app scope.
- Run the unit suite around `app/mark2/admin/authz/actions.ts` and `__tests__/authz.spec.ts` to catch policy regressions.
- Load `/mark2/admin/authz` locally to confirm the UI reflects the new feature and role pairing.

## Rollback Notes

- Remove the role grant before dropping the feature; otherwise the FK on `dojo.authz_role_feature` will block the migration.
- Clearing a user membership triggers cache invalidation; the Next.js layer will fetch a fresh policy snapshot on the next request.
