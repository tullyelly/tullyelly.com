# Hydration Strategy

Dynamic pages fetch data on the server and pass a serialized snapshot to client components.

- Releases are queried directly from Postgres via `lib/releases.ts` using the singleton pool.
- Each call invokes `unstable_noStore()` and pages export `dynamic = 'force-dynamic'` to skip caching.
- Date objects are converted to ISO strings before being sent to the client.
- Client components render the snapshot and avoid automatic re-fetching on mount.

This keeps the server-rendered HTML identical to the first client render and eliminates hydration warnings.

## Local prod harness

- Run a prod-like server locally: `npm run start:prod:local` (listens on port 4010)
- Run Playwright e2e (guards against hydration warnings): `npm run test:e2e`
  - The `e2e/fixtures.ts` hooks `page.on('console', …)` and fails on any console message containing “Hydration failed”.

## Guardrails

- ESLint bans common SSR/CSR mismatch culprits in `.tsx` files:
  - `Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()`
  - `toLocaleString()`/`toLocaleDateString()`/`toLocaleTimeString()`
  - `typeof window|document|navigator`
  - `Array.sort()` without a comparator
  - React `key` derived from array index
- Use `lib/format.ts` helpers for deterministic timestamps:
  - `formatDateISO()` for serialized UTC
  - `formatDateDisplay()` for explicit `en-US` + `UTC`
