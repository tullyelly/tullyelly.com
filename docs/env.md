# Environment Variables

Server-only variables (no `NEXT_PUBLIC_` prefix) are defined and validated in `lib/env/server.ts` and are never sent to the browser.

Browser-exposed variables must start with `NEXT_PUBLIC_` and live in `lib/env/client.ts`.

Client components may not import `lib/env/server` or access `process.env` directly.
