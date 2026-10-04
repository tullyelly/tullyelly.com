# Caching and freshness

Choose cache scope from the data contract. Sessions, capabilities, and the root
menu/persona request snapshot must remain request-specific. React cache in
[lib/root-request-data.ts](../lib/root-request-data.ts) deduplicates within one
request; do not replace it with a global session cache.
[Request tests](../__tests__/root-request-data.test.ts) preserve that boundary.

Authz has a deliberately separate per-user, revision-keyed policy cache;
[its contract](authz/AUTHZ-CONTRACT.md) describes enforcement and invalidation.
Do not cache a current-session closure across users.

Database refresh and Next data-cache freshness are distinct. A committed derived
row does not invalidate Next tags by itself. Preserve the affected data helper's
tags and invalidate after successful writes; use updateTag in server actions and
revalidateTag with the existing profile where appropriate. Stale-while-revalidate
is not immediate expiration.

[TCDB refresh](tcdb-refresh-strategy.md) owns raw snapshot triggers, derived ranking
refresh, and homie versus clan invalidation. Check actual writes and reads before
assuming a table refresh makes a page fresh. Preserve force-dynamic/noStore where
the route's contract requires it; avoid server self-fetches per
[hydration](hydration.md).
