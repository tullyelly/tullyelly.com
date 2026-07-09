# Escape Hatch Ledger

This file records legacy scripts, debug routes, test stubs, and DB bypasses that
are easy to misuse. Anything listed here should stay out of normal install, dev,
and build flows unless the status says otherwise.

## Deleted

| Escape hatch            | Status | Notes                                                                                                                                                                                             |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patch-package`         | delete | Removed from `postinstall`, `devDependencies`, and the lockfile because the repo has no `patches/` directory.                                                                                     |
| `lib/menu.ts` DB loader | delete | Removed the unused `fetchMenuPublished` helper and duplicate `flattenLinks` export. DB-backed menus now live in `lib/menu/getMenu.ts`; `lib/menu.ts` only keeps pure filtering helpers for tests. |

## Quarantined

| Escape hatch                                            | Status     | Guard                                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/patch-next-breadcrumb-types.mjs`               | quarantine | Manual only through `npm run patch:next-breadcrumb-types`; not called by install, dev, test, or build. It mutates Next internals and should only be used to investigate legacy page-level `breadcrumb` exports. |
| `NEXT_PUBLIC_MENU_SHOW_ALL`                             | quarantine | `isMenuBypassEnabled()` ignores it in production runtime. Use only for local capability-gating checks.                                                                                                          |
| `NEXT_PUBLIC_TEST_MODE`, `TEST_MODE`, `FORCE_TEST_MENU` | quarantine | `isTestMenuModeEnabled()` ignores all three in production runtime. They only activate menu test data and test scripts locally or in test runs.                                                                  |
| `E2E_MODE`, `NEXT_E2E`, `NEXT_PUBLIC_E2E_MODE`          | quarantine | Guarded by non-production helpers before enabling stub pools, test routes, listener skips, or E2E-only nav.                                                                                                     |
| `SKIP_DB`                                               | quarantine | `isDbSkipEnabled()` ignores it in production runtime. Local and test fallbacks remain available, but production cannot accidentally switch to empty data or stubs.                                              |
| `/api/db-meta`                                          | quarantine | 404 unless `DEBUG_DB_META=1` or legacy `NEXT_PUBLIC_DEBUG_DB_META=1` is set outside production.                                                                                                                 |
| `/api/env-check`                                        | quarantine | Same DB metadata guard as `/api/db-meta`; returns redacted env shape only outside production.                                                                                                                   |
| `/api/diag`                                             | quarantine | 404 unless `DEBUG_DIAG=1` is set outside production.                                                                                                                                                            |
| `/_sanity/image-check`                                  | quarantine | 404 unless `DEBUG_IMAGE_CHECK=1` is set outside production.                                                                                                                                                     |
| Breadcrumb debug forcing                                | quarantine | `debugBreadcrumb=1` and `NEXT_PUBLIC_BC_FORCE=true` are ignored in production runtime.                                                                                                                          |

## Kept

| Escape hatch                                                 | Status | Notes                                                                                                                                                                            |
| ------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/db.ts`, `db/pool.ts`, `db/schema-migrations.ts`         | keep   | These are the current DB access paths. Production-build access is blocked, URL safety checks remain centralized, and test/local stubs are gated through `lib/escape-hatches.ts`. |
| `lib/db/retry.ts`                                            | keep   | Retry wrapper for read-heavy TCDB data helpers; not a bypass and not wired into install, dev, or build scripts.                                                                  |
| `fix:next-swc`                                               | keep   | Manual package-repair script only; not part of normal lifecycle scripts.                                                                                                         |
| `dev:poll`, `dev:stable`, `dev:with-contentlayer`, `analyze` | keep   | Explicit developer commands. They are not normal install or build hooks.                                                                                                         |

## Document Only

| Escape hatch                    | Status        | Notes                                                                                                          |
| ------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `SEO_METADATA_ENFORCE=warn/off` | document only | Local metadata-lint relief valve in `scripts/ensure-metadata.js`; CI should keep strict enforcement.           |
| `FORMAT_CHECK_BASE`             | document only | Local formatting diff override for `scripts/check-formatting.mjs`; does not affect production runtime.         |
| `DISABLE_SENTRY=1`              | document only | Local/test observability escape hatch; production should keep Sentry enabled through normal env configuration. |
