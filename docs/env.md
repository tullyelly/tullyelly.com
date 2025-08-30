# Environment Variables

Environment variables are validated with Zod in `lib/env.ts`.

- `Env` exposes server-only values (no `NEXT_PUBLIC_` prefix).
- `PublicEnv` contains browser-safe variables starting with `NEXT_PUBLIC_`.

Client components should import from `lib/env` only when reading `PublicEnv`; never access `process.env` directly.

## Testing flags

- `E2E_MODE`: when set to `'1'`, the app stubs database calls for Playwright tests.
- `DISABLE_SENTRY`: set to `'1'` to skip Sentry initialization (used in tests).
