# Authorization contract

## Enforcement API

`@/lib/authz` exports can(user, feature), must(user, feature, options?),
must(feature, options?), canCurrentUser(feature), and mustCurrentUser(feature, options?).
User may be null or contain id and optional authzRevision. can returns false for
missing users; must throws AuthzUnauthenticatedError (401) or AuthzForbiddenError
(403). Deny beats allow; unknown or disabled features deny. { strict: true }
compares the resolved policy revision with a fresh DB revision and rejects a
stale policy; it does not silently retry. Enforce on the server before reads or
mutations that require permission. UI gates and menu filtering are hints.
[Implementation](../../lib/authz/index.ts), [types](../../lib/authz/types.ts),
[policy tests](../../__tests__/authz.spec.ts).

## Membership and freshness

The resolver reads dojo.authz_user_app_role, not the legacy authz_user_role.
NULL app_id is global; app-scoped roles apply only to features belonging to that
app. Role-feature effects and feature.enabled produce allow/deny/enabled sets.
Each getEffectivePolicy call reads dojo.authz_get_revision(userId::uuid), then
uses unstable_cache keyed by authz-policy, user ID, and revision, with tag
`auth:user:{id}`. Revision changes select a fresh key even without a listener.
Session JWT enrichment also reads revisions; see [menu](../menu.md).
[Resolver](../../lib/authz/resolve.ts),
[revision tests](../../__tests__/authz-resolve.test.ts).

Migration 014 defines authz_grant_role(actor UUID, target UUID, role TEXT,
app_slug TEXT DEFAULT NULL) and authz_revoke_role with the same signature.
They assert admin.membership.manage on the admin app, mutate memberships, and
bump/notify on changed rows in the same transaction.
[Admin actions](../../app/mark2/admin/authz/actions.ts) use strict enforcement,
prevent last-admin self-lockout, then updateTag for immediate action freshness.
The authz_changed LISTEN subscriber uses revalidateTag(tag, 'max'); it skips
build/test/E2E/SKIP_DB environments. It is best-effort, not the sole freshness
mechanism. [Listener](../../lib/authz/invalidation.ts),
[action tests](../../__tests__/admin-authz-actions.spec.ts),
[listener tests](../../__tests__/authz-invalidation.spec.ts).

Changing a role grant or feature enabled value requires revision bumps for all
affected users and notifications/invalidation. Do not assume a generic trigger
handles these changes; migration 065 explicitly performs this work for its
feature update. See [workflow](WORKFLOW.md).

## Audit and history

[Database](../database.md) owns the actual audit columns and writeAudit mapping.
[Archived spike documents](../README.md) preserve design rationale, proposed seed
roles, and retention ideas; they are not the current schema or capability catalogue.
Feature keys use lowercase app.area.verb; seeded keys/grants are established by
migrations and deployed DB state, not a hardcoded documentation role matrix.
