# POLICY ; WU-375 (Spike)

## Decision Rules

1. **Default deny**.
2. **Deny beats allow** when both are present.
3. Unknown feature key → deny.
4. If `authz_feature.enabled = false`, treat as deny.

## Resolution Algorithm (conceptual)

1. Resolve user (NextAuth) from `auth.users(id)`.
2. Join user→roles (`dojo.authz_user_role`) → role→features (`dojo.authz_role_feature`).
3. Build allow/deny sets keyed by `feature.key`.
4. Decision:
   - if key ∈ deny → deny
   - else if key ∈ allow AND feature.enabled → allow
   - else deny
