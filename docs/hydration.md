# Hydration Strategy

Dynamic pages fetch data on the server and pass a serialized snapshot to client components.

- Releases are queried directly from Postgres via `lib/releases.ts` using the singleton pool.
- Each call invokes `unstable_noStore()` and pages export `dynamic = 'force-dynamic'` to skip caching.
- Date objects are converted to ISO strings before being sent to the client.
- Client components render the snapshot and avoid automatic re-fetching on mount.

## Guardrails

- `npm run start:prod` builds and serves the production bundle locally.
- Playwright test `shaolin-scrolls.spec.ts` fails on any console hydration mismatch.
- ESLint bans `toLocaleString`, `Date.now`, `Math.random`, and array index keys in `.tsx` files.

This keeps the server-rendered HTML identical to the first client render and eliminates hydration warnings.
