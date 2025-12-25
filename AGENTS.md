# AGENTS.md

A predictable brief for coding agents working on **tullyelly.com**.
Humans: see `README.md` for introductions and contributor docs.

## Project Overview

- Framework: Next.js (App Router), TypeScript, Tailwind.
- Content: Contentlayer v2 for `content/chronicles/*.mdx`; static MDX pages under `app/<slug>/page.mdx`.
- Auth: NextAuth (Google) with Prisma adapter scoped to the `auth` schema.
- Package manager: **npm** (do not switch tools).
- Hosting: Vercel (prod + preview).
- Database: Neon Postgres via `pg` helper; DB access is blocked during Next.js production builds.

## Setup & Common Commands

- Node 20 recommended. `npm ci` to install; `npm run dev` triggers `prepare:content` to build Contentlayer data and `lib/build-info.ts`.
- Install deps: `npm ci`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Tests (unit/e2e if present): `npm test`
- Dev server: `npm run dev`
- Build: `npm run build`
- Required env: `DATABASE_URL`, `NEXTAUTH_SECRET` (or `AUTH_SECRET`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL` (defaults to localhost). Tests and Playwright use `TEST_DATABASE_URL` (`.env.test`).
- Local flags: `NEXT_PUBLIC_MENU_SHOW_ALL=1` (bypass menu gating), `SKIP_DB=true` (explicitly fail DB access), `E2E_MODE=1` (stubbed pool for scrolls reads).
- Local DB note: never write to prod; honor `assertDbSafety` and `.env*` rules.

## Content & Pages

- Chronicles: `content/chronicles/*.mdx` frontmatter (`title`, `date`, `summary`, `tags`, `draft`, `infinityStone`, `cover`, `canonical`) feed `app/shaolin` routes; comments require NextAuth session.
- Static MDX pages: `npm run new-page <slug> "Title"` scaffolds `app/<slug>/page.mdx` pointing at `public/images/optimized/<slug>/hero.webp` (source under `public/images/source/`). Validate with `npm run validate-frontmatter && npm run validate-seo`.
- Use the image pipeline (`npm run images:optimize && npm run images:check`) before committing new assets.

## Data & Auth

- Menu data comes from `dojo.v_menu_published` and is filtered by capabilities in `dojo.authz_effective_features`; `NEXT_PUBLIC_MENU_SHOW_ALL=1` bypasses this locally. `scripts/seed-e2e.mjs` seeds menu personas/features for tests.
- Shaolin Scrolls and TCDB rankings read from DB views; `E2E_MODE=1` swaps in a stub pool for scrolls reads only.
- Prisma is limited to the `auth` schema; other data flows through `pg` via `lib/db`.
- `/api/comments` uses `dojo.v_blog_comment` and requires an authenticated user.

## Code Style & Conventions

- TypeScript: prefer strict types; do not add `any` without a TODO + ticket.
- ESLint: use the repo's single eslint config; do not introduce a second config file.
- Formatting: follow existing Prettier settings; single source of truth is repo config.
- UI: Tailwind; keep styles minimal and token-ish; no inline color hexes outside design tokens.

## Voice & Punctuation

- Em dashes are prohibited in user-visible copy.
- Use a semicolon instead of any em dash.
- Scope: MD/MDX text and JSX/TSX JSXText.
- Exceptions: tests, vendor, or quotes annotated with `// punctuation-allowed` or frontmatter `punctuation: allowed`.

## Flowers & Credits

- Use `FlowersInline` for section-level acknowledgments; mirror the Chronicles and Shaolin Scrolls patterns.
- Show at most one Flowers call per section and surface matching items on `/credits`.

## Testing & CI Expectations

- Before committing: `npm run lint && npm run typecheck && npm test`
- If tests fail, fix or add tests for changed code.
- Do not skip CI checks in PRs.
- Coverage thresholds: 85% lines/statements/functions and 80% branches (Jest). `.husky/pre-push` runs lint, typecheck, `test:smoke`, and `test:coverage`; bypass with `SKIP_COVERAGE_GUARD=1` only if needed.
- CI workflow (`ci.yml`) is gated by repo var `CI_ENABLED`; it runs lint, typecheck, metadata lint, format check, Jest smoke + coverage, optional image/SEO checks, build, and security header smoke. E2E job follows when enabled.
- `coverage.yml` always runs on `main` and PRs to `main` and uploads `coverage/lcov.info`.

## Pull Request Rules

- Branch name: `cipher/<short-feature-name>` or `feature/<ticket>`
- Title: `[WU-####] <concise description>`
- Include: scope, rationale, screenshots (UI), and risk notes.
- Keep changesets small; split refactors from feature logic.

## Security & Secrets

- Never commit `.env*` or secrets; use Vercel project env vars.
- Be cautious with migrations and prod data; assume least privilege.

## Radix UI (Dialogs/Modals)

- All dialogs use **Radix UI** primitives; no ad-hoc modals.
- Follow the existing dialog component patterns in the repo.

## DB & Migrations

- SQL lives under `db/migrations/*`; use existing naming schemes.
- For Shaolin Scrolls helpers (e.g., `dojo.fn_next_hotfix`), keep PL/pgSQL style consistent and add tests.

## Deployment Notes

- Preview deployments come from Vercel on PR.
- Production is promoted via Vercel (no direct writes to prod DB in local scripts).

## Monorepo Ready

- If/when packages are added, place package-level `AGENTS.md` near each package root.
- Agents should read the nearest `AGENTS.md`.

## Out-of-Bounds for Agents

- Do not change licensing, branding, palettes, or persona names.
- Do not rename public URLs or `tullyelly`/`shaolin` identifiers without an approved ticket.
