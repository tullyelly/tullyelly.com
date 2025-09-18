# Hydration Contract

This project renders pages on the server and expects the client to render the same initial markup. To avoid mismatches:

- **Deterministic data** – server components must return plain JSON objects. Dates are converted to UTC strings via `toISOString()` before sending to the client.
- **Stable first paint** – client components receive an `initialData` snapshot and render it without refetching on mount.
- **No runtime randomness** – `Date.now()`, `new Date()`, `Math.random()`, and `typeof window` are banned in `.tsx` files.
- **Timestamp formatting** – format with the `fmt*` helpers in `lib/datetime` so SSR and client renders stay aligned.
- **Cache policy** – pages that read from the database declare `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`.
- **Client-only widgets** – use `dynamic(() => import('...'), { ssr: false })` rather than `typeof window` guards.

CI enforces these rules with ESLint, unit tests, and Playwright checks for “Hydration failed” in the browser console.
