# tullyelly.com

Next.js App Router site for tullyelly.com. The project combines MDX chronicles,
persona-based navigation, card and review tools, authenticated comments, and
Postgres-backed feature/menu data.

## What This Project Does

- Publishes chronicles from `content/chronicles/*.mdx` at `/shaolin`.
- Serves persona areas such as `mark2`, `cardattack`, `theabbott`,
  `unclejimmy`, and `tullyelly`.
- Provides database-backed pages for Shaolin Scrolls, TCDB rankings/trades,
  set collecting, local card shops, reviews, comments, authz, and profile data.
- Uses Google sign-in through NextAuth; Prisma is limited to the `auth` schema.
- Builds navigation from `dojo.v_menu_published` and filters it by effective
  feature capabilities.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript, typed routes
- Tailwind CSS v4 with CSS tokens in `app/globals.css`
- MDX through `@next/mdx` and Contentlayer v2
- Postgres via `pg`; Prisma adapter only for NextAuth tables
- NextAuth Google provider
- Radix UI primitives, lucide icons, shadcn-style component aliases
- Jest, Testing Library, Vitest, Playwright, ESLint, Prettier, secretlint
- Vercel deployment support

## Repository Structure

```text
app/                    Next.js routes, layouts, route handlers, page-local libs
components/             Shared React components and UI primitives
content/chronicles/     Chronicle MDX content consumed by Contentlayer
db/                     SQL migrations, schema snippets, verification scripts, pool
docs/                   Project docs for authoring, migrations, authz, images, etc.
e2e/                    Playwright specs and visual snapshots
lib/                    Shared app, DB, menu, authz, SEO, data, and content helpers
mdx/                    MDX remark tooling
prisma/                 Prisma schema for the NextAuth `auth` schema
public/                 Static images, videos, fonts, and generated optimized assets
scripts/                Content, image, DB, metadata, coverage, and guardrail scripts
tests/                  Additional Playwright-style tests and utilities
__tests__/              Jest unit and integration tests
vitest/                 Vitest component/client tests
```

Important config files:

- `package.json` for npm scripts
- `next.config.mjs` for Next, MDX, Contentlayer, headers, and bundling config
- `contentlayer.config.ts` for chronicle document fields and inferred tags
- `jest.config.cjs`, `vitest.config.ts`, `playwright.config.ts` for tests
- `eslint.config.mjs`, `tailwind.config.mjs`, `postcss.config.mjs`
- `.npmrc` uses npm nested install strategy and lockfile v2
- `vercel.json` is present for Vercel project config

## Prerequisites

- Node.js 20 is the project baseline. The repo currently also runs under newer
  Node locally, but CI uses Node 20.
- npm only. Do not switch package managers.
- Postgres-compatible database for DB-backed pages and auth flows.
- Google OAuth credentials for real sign-in flows.
- Playwright browsers for E2E tests, installed through the npm script below.

## Environment Setup

Start from the examples:

```bash
cp .env.example .env.local
cp .env.test.example .env.test
```

Core variables:

| Variable                                   | Purpose                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                             | Main Postgres connection string for local runtime and DB scripts.                               |
| `TEST_DATABASE_URL`                        | Test database connection string used by Jest/Playwright and E2E seed scripts.                   |
| `NEXTAUTH_SECRET` or `AUTH_SECRET`         | NextAuth secret.                                                                                |
| `NEXTAUTH_URL`                             | NextAuth base URL; local examples use `http://localhost:3000` or Playwright's `127.0.0.1:4321`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials.                                                                       |
| `NEXT_PUBLIC_SITE_URL`                     | Public canonical URL for metadata; defaults exist in code for local use.                        |

Useful local-only flags:

| Flag                          | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_MENU_SHOW_ALL=1` | Bypass menu capability filtering locally. Ignored in production runtime. |
| `SKIP_DB=true`                | Explicitly disables DB access outside production runtime.                |
| `E2E_MODE=1`                  | Enables E2E stubs for limited DB reads and test-only routes.             |
| `DEBUG_DB_META=1`             | Exposes `/api/env-check` and `/api/db-meta` locally.                     |
| `DISABLE_SENTRY=1`            | Disables Sentry outside normal production configuration.                 |

See `docs/escape-hatches.md` for legacy and debug escape hatches. Never commit
real `.env*` files or connection strings.

## Local Development

Install dependencies:

```bash
npm ci
```

Generate build metadata, the image manifest, and Contentlayer data:

```bash
npm run prepare:content
```

Run the app:

```bash
npm run dev
```

For active MDX/chronicle editing, run the app and Contentlayer watcher together:

```bash
npm run dev:full
```

Other local dev modes:

```bash
npm run dev:stable          # webpack, polling, no filesystem cache
npm run dev:turbo           # Turbopack
npm run dev:with-contentlayer
```

The app's health endpoint is:

```bash
curl -s http://localhost:3000/api/health
```

## Common Commands

| Command                          | Purpose                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run prepare:content`        | Regenerate `lib/build-info.ts`, `lib/images/optimus-images-manifest.json`, and `.contentlayer`. |
| `npm run lint`                   | Run ESLint with the repo config.                                                                |
| `npm run typecheck`              | Run TypeScript; preflight regenerates content.                                                  |
| `npm run format:check`           | Check Prettier formatting for changed tracked files.                                            |
| `npm run format`                 | Format JS/TS/MD/MDX/JSON/YAML/CSS files.                                                        |
| `npm test`                       | Run Jest; preflight regenerates content.                                                        |
| `npm run test:smoke`             | Run related Jest smoke tests.                                                                   |
| `npm run test:coverage`          | Run Jest with coverage thresholds.                                                              |
| `npm run test:components`        | Run Vitest tests under `vitest/`.                                                               |
| `npm run test:e2e`               | Run Playwright E2E tests.                                                                       |
| `npm run build`                  | Generate content, run `prisma generate`, then `next build`.                                     |
| `npm run start`                  | Start a built Next app.                                                                         |
| `npm run analyze`                | Run bundle analyzer build.                                                                      |
| `npm run check:emdash`           | Reject em dashes in user-visible MD/MDX/JSX copy.                                               |
| `npm run secrets:scan`           | Run secretlint over the repo.                                                                   |
| `npm run security-headers:check` | Verify expected security headers against a URL.                                                 |

## Content and Assets

Chronicles live in `content/chronicles/*.mdx` and become `/shaolin/<slug>`
routes. Contentlayer requires `title`, `date`, and `summary`; optional fields
include `tags`, `draft`, `infinityStone`, `cover`, `canonical`, and `alterEgo`.
The Contentlayer config also infers tags from supported MDX components such as
`ReleaseSection`, `PersonTag`, clan snapshots, and YouTube videos.

Create a chronicle:

```bash
npm run new-chronicle -- "Title"
```

Create a static MDX page:

```bash
npm run new-page <slug> "Title"
```

Image workflow:

```bash
npm run images:optimus -- "<folder>"
npm run images:check
npm run assets:report
```

Source assets go in `public/images/source/`; optimized outputs land under
`public/images/optimus/<folder>/`. See `docs/images.md` and
`docs/authoring.md` for the full authoring flow. Detailed MDX metadata behavior
is documented in `docs/contentlayer-inference.md`.

## Data, Auth, and Database

- Runtime DB access flows through `lib/db.ts` and `db/pool.ts`.
- `db/pool.ts` blocks DB access during Next production builds.
- `db/assert-database-url.ts` rejects unsafe production `neondb_owner/neondb`
  URLs.
- Prisma is scoped to the `auth` schema in `prisma/schema.prisma`.
- Menu rows come from `dojo.v_menu_published`.
- Effective feature checks use `dojo.authz_effective_features` and related
  authz helpers under `lib/authz`.
- Comments use `dojo.v_blog_comment`.

DB commands:

```bash
npm run db:ping
npm run db:migrate:status
npm run db:migrate:apply
npm run db:migrate:verify
```

Migration scripts load `.env.local` by default. To target another env file:

```bash
DOTENV_CONFIG_PATH=.env.test npm run db:migrate:status
```

SQL migrations live in `db/migrations` and are tracked in
`dojo.schema_migration`. Do not edit migrations after applying them to a shared
database; add a new migration instead. See `docs/migrations.md`.

E2E seed data:

```bash
npm run pretest:e2e:seed
```

The seed script reads `.env.test`, uses `TEST_DATABASE_URL` or `DATABASE_URL`,
and refuses production-looking databases outside CI.

## Testing

Unit and integration tests:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
npm run coverage:check
```

Component/client tests:

```bash
npm run test:components
```

Playwright:

```bash
npm run test:e2e:install
npm run test:e2e
```

Playwright loads `.env.test`, requires `TEST_DATABASE_URL` or `DATABASE_URL`,
seeds fixtures in `pretest:e2e`, builds the E2E app, and serves it on
`127.0.0.1:4321`.

To use a system Chrome:

```bash
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_USE_SYSTEM_CHROME=1
export PLAYWRIGHT_CHROME_PATH="/usr/bin/google-chrome"
npm run test:e2e
```

## Code Quality and CI

- ESLint is configured in `eslint.config.mjs`.
- Prettier is the formatting source of truth.
- `lint-staged` runs secretlint, Prettier, ESLint, and the MD/MDX semicolon
  fixer on staged files.
- Husky `pre-commit` runs lint-staged.
- Husky `pre-push` runs lint, typecheck, `test:smoke`, and `test:coverage`.
  Set `SKIP_COVERAGE_GUARD=1` only when you intentionally need to bypass it.
- Jest coverage thresholds are 85% lines/statements/functions and 80% branches.

GitHub Actions:

- `.github/workflows/ci.yml` runs on pushes to `main` and PRs targeting `main`.
  It installs dependencies, then runs lint, typecheck, `test:ci`, build with
  `SKIP_DB=true`, and a security header check against `/api/health`.
- `.github/workflows/coverage.yml` runs coverage on `main` and PRs to `main`
  and uploads `coverage/lcov.info`.

## Build and Deployment

Build locally:

```bash
npm run build
```

Run a production build locally:

```bash
npm run start:prod:local
```

Vercel deployment support is present through `vercel.json` and npm scripts.
The production deploy script builds locally through Vercel and deploys the
prebuilt output:

```bash
npm run deploy:prod
```

Build provenance is exposed at:

```bash
curl -s https://<app-url>/api/__version
```

Security headers are defined in `next.config.mjs` and checked by
`npm run security-headers:check`.

## Contribution Workflow

1. Branch from the current base branch. Existing project guidance uses
   `cipher/<short-feature-name>` or `feature/<ticket>`.
2. Keep feature changes and refactors separate where possible.
3. Update docs when behavior, commands, env vars, or authoring flows change.
4. Before opening a PR, run the checks that match your change:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

5. For DB changes, add a numbered SQL migration under `db/migrations` and run
   `npm run db:migrate:verify` against the intended non-production database.
6. For UI changes, include screenshots in the PR.

The PR template asks for summary, Jira ID, reviewers, checks, and screenshots
for UI work.

## Troubleshooting

**Next says the lockfile is missing SWC dependencies**

Run:

```bash
npm ci --include=optional
```

On Linux arm64, verify the local binary can load:

```bash
node -e "require('@next/swc-linux-arm64-gnu'); console.log('ok')"
```

If the lockfile checker still tries to patch at dev startup, run this diagnostic
without starting the server:

```bash
node -e "const { patchIncorrectLockfile } = require('next/dist/lib/patch-incorrect-lockfile'); patchIncorrectLockfile(process.cwd()).then(()=>console.log('ok'))"
```

**Content edits do not show up**

Run `npm run dev:full` so Contentlayer watches MDX files, or rerun
`npm run prepare:content`.

**DB-backed pages fail during build**

Production builds intentionally block DB access. Static generation paths should
use build-safe data or fallbacks. Set `SKIP_DB=true` only for local/test
escape-hatch behavior; production runtime ignores it.

**Playwright refuses to start**

Check `.env.test`. `playwright.config.ts` requires `TEST_DATABASE_URL` or
`DATABASE_URL`.

**Metadata lint fails**

Page routes need a metadata export or metadata builder. See
`scripts/ensure-metadata.js` and `docs/static-page-template-v2.md`.

**Image checks fail**

Run the optimizer for the relevant folder, then rerun `npm run images:check`.
Use `npm run assets:report` to inspect large assets before committing.

## Caveats and Known Limits

- DB access is intentionally disabled during Next production builds.
- `scripts/patch-next-breadcrumb-types.mjs` is a quarantined legacy script for
  unsupported page-level `breadcrumb` exports. Do not wire it into normal
  install, dev, test, or build flows.
- Debug routes such as `/api/db-meta`, `/api/env-check`, `/api/diag`, and
  `/_sanity/image-check` require explicit local debug flags and 404 in
  production.
- User-visible copy should avoid em dashes; use semicolons instead.
- Do not rename public URLs, persona names, `tullyelly`, or `shaolin`
  identifiers without an approved ticket.

## More Documentation

- `docs/authoring.md` for static page authoring
- `docs/contentlayer-inference.md` for inferred chronicle metadata
- `docs/images.md` for image and asset handling
- `docs/migrations.md` for SQL migration workflow
- `docs/menu.md` for menu capability gating
- `docs/authz/` for authorization policy and workflows
- `docs/hydration.md` and `docs/hydration-contract.md` for hydration contracts
- `docs/escape-hatches.md` for legacy/debug escape hatches
