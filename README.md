# tullyelly.com

[![Coverage ≥85%](https://img.shields.io/badge/coverage-%E2%89%A585%25-blue)](#-guardrails--coverage)

Next.js App Router with Tailwind v4 tokens, Contentlayer-powered chronicles, Postgres-backed menus and comments, and NextAuth (Google) via Prisma for the auth schema.

---

## 🚀 Getting Started

Recommended Node: **20**. Install deps and start dev:

```bash
npm ci
npm run dev
```

Environment basics:

- `DATABASE_URL` – required for most pages; production rejects `neondb_owner/neondb` combos.
- `TEST_DATABASE_URL` – used by tests and Playwright.
- `NEXTAUTH_SECRET` (or `AUTH_SECRET`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – NextAuth with Prisma adapter scoped to the `auth` schema.
- `NEXT_PUBLIC_SITE_URL` – base URL for metadata; defaults to `http://localhost:3000`.
- Optional local flags: `NEXT_PUBLIC_ANNOUNCEMENT` (banner), `NEXT_PUBLIC_MENU_SHOW_ALL=1` (bypass menu gating), `SKIP_DB=true` (explicitly fail DB access), `E2E_MODE=1` (stubbed pool for scrolls reads).
- `npm run prepare:content` regenerates `lib/build-info.ts` and Contentlayer data; it runs before dev, typecheck, and tests.

---

## 📚 Content & Authoring

- Chronicles live in `content/chronicles/*.mdx` and are built by Contentlayer. Frontmatter: `title`, `date`, `summary`, `tags`, `draft`, `infinityStone`, `cover`, `canonical`. Slugs map to `/shaolin/<slug>`.
- Chronicle pages render via `app/shaolin/[slug]/page.tsx`; comments post to `/api/comments` and require a signed-in user.
- Scaffold a static MDX page with `npm run new-page <slug> "Title"`. It writes `app/<slug>/page.mdx` with frontmatter and expects a hero at `public/images/optimized/<slug>/hero.webp` (drop sources in `public/images/source/` first).
- Validate page metadata and frontmatter with `npm run validate-frontmatter && npm run validate-seo`; run `npm run images:optimize && npm run images:check` to keep assets within budget.
- Reference docs: `docs/authoring.md`, `docs/static-page-template-v2.md`, and `docs/hydration*.md` for SSR to client hydration contracts.

---

## 🗃️ Database, Auth, and Menu

- Postgres via `pg` and the `lib/db` tagged template helper; DB access is blocked during production builds and when `SKIP_DB=true`.
- Prisma is scoped to the `auth` schema only (`prisma/schema.prisma`). `postinstall` runs `prisma generate` and `patch-package`.
- Menu data flows from `dojo.v_menu_published`, filtered by capabilities in `dojo.authz_effective_features`, and cached per capability hash (`lib/menu/getMenu`). Set `NEXT_PUBLIC_MENU_SHOW_ALL=1` locally to bypass filtering.
- `scripts/seed-e2e.mjs` seeds menu personas/features in test DBs; Playwright setup expects `.env.test` with `TEST_DATABASE_URL`.
- Shaolin Scrolls (`app/mark2/shaolin-scrolls`) and TCDB rankings (`app/cardattack/tcdb-rankings`) read from database views; `E2E_MODE=1` swaps in a stub pool for scrolls reads only.
- `/api/comments` uses `dojo.v_blog_comment`; posting requires a NextAuth session and Zod-validated input.

---

## 🎨 Design Tokens & Styles

- Tokens live in `app/globals.css`; Tailwind (`tailwind.config.mjs`) maps them to utilities and brand colors.
- `Card` supports `accent="bucks" | "cream-city-cream" | "great-lakes-blue"` with 2px borders.
- Desktop tables use `components/ui/Table` with `.zebra-desktop` striping and optional `variant="bucks"` framing.
- Form inputs share the `.form-input` class defined in `app/globals.css`.
- MDX uses a remark plugin that swaps em dashes for semicolons; keep user-visible copy em dash free.

---

## ✅ Guardrails & Coverage

- Jest thresholds: 85% lines/statements/functions, 80% branches (see `jest.config.cjs`). `npm run test:coverage` and `npm run test:ci` enforce them.
- `npm run coverage:check` reads `coverage/coverage-summary.json` and fails if lines dip below `COVERAGE_MINIMUM` (default 80); CI uploads the summary artifact.
- `.husky/pre-push` runs `lint`, `typecheck`, `test:smoke`, and `test:coverage`; bypass with `SKIP_COVERAGE_GUARD=1` only in emergencies.
- Security headers (HSTS, frame denial, MIME sniffing) are asserted in CI via `npm run security-headers:check`.
- Lint-staged (pre-commit) runs Prettier, ESLint, secretlint, and the MD/MDX semicolon fixer.

---

## 🖼️ Image Optimization Pipeline

Optimize large images before pushing to the repo:

1. Place original images into:

   ```
   public/images/source/
   ```

2. Generate optimized assets:

   ```bash
   npm run images:optimize
   ```

3. Verify outputs:

   ```bash
   npm run images:check
   ```

4. Optimized images are saved to:

   ```
   public/images/optimized/
   ```

Images are resized to a **1920px** max width and exported as **WebP**.

---

## 📣 Share Kit

Keep stakeholder snippets in sync whenever you ship a new page.

- Add the slug to your metadata so `canonicalUrl(slug)` can supply the canonical entry.
- Add a one-liner in `/lib/share/oneLiners.ts`.
- Run `npm run share:generate` to refresh Confluence-ready Markdown in `/docs/share/<slug>.md`.

---

## 🗃️ Database

This project requires a **Postgres** database and NextAuth secrets.

Set `NEXT_PUBLIC_DEBUG_DB_META=1` to expose `/api/env-check` with redacted database env vars for debugging.

For tests, create a `.env.test` file so `npm test` can load a dedicated database URL:

```bash
# .env.test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/tullyelly_test
```

Using a Neon branch instead of local Postgres? Point `TEST_DATABASE_URL` at your **branch URL** (placeholder shown):

```bash
# .env.test (example)
TEST_DATABASE_URL="postgresql://<user>:<password>@<your-neon-branch-host>/<db-name>?sslmode=require&channel_binding=require"
```

🔐 Secrets hygiene: Never paste real connection strings into docs or code. In CI or Vercel use secrets (`DATABASE_URL`, `TEST_DATABASE_URL`). Locally, keep them only in untracked `.env*` files.

Verify connectivity:

```bash
# Verify connectivity
curl -s http://localhost:3000/api/_health

# Metadata + counts
curl -s http://localhost:3000/api/db-meta
curl -s http://localhost:3000/api/shaolin-scrolls/count

# Shaolin Scrolls queries
curl -s "http://localhost:3000/api/shaolin-scrolls?limit=5&offset=0&sort=semver:desc"
curl -s "http://localhost:3000/api/shaolin-scrolls?q=scroll"

# Mutations (creates new scrolls)
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"label":"Test patch"}' http://localhost:3000/api/shaolin-scrolls/patch

curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"label":"Test minor"}' http://localhost:3000/api/shaolin-scrolls/minor
```

---

## ♻️ Hydration

See [docs/hydration.md](docs/hydration.md) and [docs/hydration-contract.md](docs/hydration-contract.md) for how server-rendered data stays in sync with client hydration.

---

## 📜 Scripts

- `npm run lint` – lint the codebase (includes metadata enforcement via `lint:metadata`)
- `npm run typecheck` – run TypeScript checks; preflight runs `prepare:content`
- `npm run format:check` – verify formatting without writing changes
- `npm run deadcode` – list unused exports
- `npm run guard:self-fetch` – block Next.js self-fetch patterns
- `npm run check:use-server` – flag invalid `"use server"` exports
- `npm run prepare:content` – generate build info and Contentlayer data
- `npm run build` – production build; `npm run start` starts it locally
- `npm run db:ping` – verify DB connectivity (SELECT 1)
- `npm run check:emdash` – reject em dashes in MD/MDX/JSX copy
- `npm run security-headers:check` – assert HSTS, frame, and MIME headers
- `npm run share:generate` – refresh `/docs/share/<slug>.md`

---

## 🧪 CI

GitHub Actions includes:

- **CI** (`.github/workflows/ci.yml`) – gated by `CI_ENABLED` repo variable. Runs lint, typecheck, metadata lint, format check, Jest smoke + coverage (`test:ci`), `coverage:check`, optional image/SEO validators, build, and security header smoke. E2E job follows when enabled and paths match.
- **coverage** – always on `main` and PRs to `main`, runs `npm run test:coverage` and uploads `coverage/lcov.info`.

---

## Running E2E

**Cache-first (recommended):**

```bash
npm ci
npm run test:e2e:install
npm run test:e2e
```

`.env.test` must provide `TEST_DATABASE_URL` (used for seeding menu/authz fixtures in `pretest:e2e:seed`). Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and `PLAYWRIGHT_USE_SYSTEM_CHROME=1` to lean on a system Chrome:

```bash
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_USE_SYSTEM_CHROME=1
export PLAYWRIGHT_CHROME_PATH="/usr/bin/google-chrome"
npm run test:e2e
```

---

## 🔏 Build Provenance

Confirm deployments with a build receipt and headers:

```bash
# JSON receipt
curl -s https://<app-url>/api/__version | jq

# Headers on any response
curl -I https://<app-url>/ | grep -i "^x-"
```

If @sentry/nextjs is installed and SENTRY_DSN is set, releases inherit the same commit and environment metadata.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Imagemin](https://github.com/imagemin/imagemin)

---

## ☁️ Deployment

Deploy to production manually via the Vercel CLI:

```bash
export VERCEL_TOKEN=...
npx vercel --prod --token "$VERCEL_TOKEN"
```

---

## ✅ Quick Notes

- App shell lives in `components/app-shell/AppShell` with menu data from `lib/menu/getMenu` and persona-aware metadata in `app/_menu`.
- Home tiles render from `components/home/*` (`app/page.tsx`).
- Chronicles index and tag filters: `app/shaolin/page.tsx`; details: `app/shaolin/[slug]/page.tsx`.
- Shaolin Scrolls UI: `app/mark2/shaolin-scrolls`; TCDB rankings live at `app/cardattack/tcdb-rankings`.
- Credits and Flowers plumbing: `app/credits` and `components/flowers/FlowersInline.tsx`.
- Build info is written to `lib/build-info.ts` by `npm run gen:build-info`; Contentlayer output sits in `.contentlayer`.
