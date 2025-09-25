# INVALIDATION ; WU-375 (Spike)

**Goal:** Make policy changes live without redeploys.

## Mechanism

- Add `policy_revision INT NOT NULL DEFAULT 0` to the user profile context we read at auth-time (v1: track on server and bump for the Next.js cache tag).
- Cache per-user capability set and tag with **`auth:user:{id}`**.
- On any membership or grant change:
  1. Increment the user’s `policy_revision`.
  2. Call `revalidateTag('auth:user:{id}')`.

## When to Bump

- Insert/delete in `dojo.authz_user_role`.
- Insert/delete/update in `dojo.authz_role_feature`.
- Update to `dojo.authz_feature.enabled`.
