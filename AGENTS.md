# AGENTS.md

A predictable brief for coding agents working on **tullyelly.com**.
Humans: see `README.md` for introductions and contributor docs.

## Project Overview

- Framework: Next.js (App Router), TypeScript, Tailwind.
- Package manager: **npm** (do not switch tools).
- Hosting: Vercel (prod + preview).
- Database: Neon Postgres via `pg` (no ORM). `assertDbSafety` prevents prod writes outside CI.

## Setup & Common Commands

- Install deps: `npm ci`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Tests (unit/e2e if present): `npm test`
- Dev server: `npm run dev`
- Build: `npm run build`
- Local DB note: never write to prod; honor `assertDbSafety` and `.env*` rules.

## Code Style & Conventions

- TypeScript: prefer strict types; do not add `any` without a TODO + ticket.
- ESLint: use the repo’s single eslint config; do not introduce a second config file.
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
- For release helpers (e.g., `dojo.fn_next_hotfix`), keep PL/pgSQL style consistent and add tests.

## Deployment Notes

- Preview deployments come from Vercel on PR.
- Production is promoted via Vercel (no direct writes to prod DB in local scripts).

## Monorepo Ready

- If/when packages are added, place package-level `AGENTS.md` near each package root.
- Agents should read the nearest `AGENTS.md`.

## Out-of-Bounds for Agents

- Do not change licensing, branding, palettes, or persona names.
- Do not rename public URLs or `tullyelly`/`shaolin` identifiers without an approved ticket.
