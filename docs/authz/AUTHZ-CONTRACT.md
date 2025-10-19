# AUTHZ CONTRACT ; WU-375 (Spike)

> Implement in WU-377.

## Functions

```ts
type FeatureKey = string;

declare function can(user: { id: string }, feature: FeatureKey): Promise<boolean>;

declare function must(user: { id: string }, feature: FeatureKey): Promise<void>;
// throws AuthzUnauthenticatedError (401) or AuthzForbiddenError (403)
Errors
AuthzUnauthenticatedError (401) — user not signed in.

AuthzForbiddenError (403) — signed-in but lacks capability.

Logging
Log denies at info: { userId, featureKey, requestId } (no sensitive data).
```
