# tullyelly.com

[![Coverage ≥80%](https://img.shields.io/badge/coverage-%E2%89%A580%25-blue)](#-guardrails--coverage)

A [Next.js](https://nextjs.org) project customized with **Tailwind v4 design tokens** and an **image optimization pipeline**.

---

## 🚀 Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Pages auto-update when you edit files in the `app/` folder.

---

## ✅ Guardrails & Coverage

- The `CI` workflow runs lint, format checks, typechecks, and Jest unit tests with coverage on every push; it also runs each Monday at 06:00 UTC to log coverage trends.
- Coverage must stay at or above 80 percent; `npm run coverage:check` reads `coverage/coverage-summary.json`, posts the metrics to the job summary, and fails the workflow if the threshold is missed.
- The pipeline uploads `coverage/coverage-summary.json` as an artifact so you can track the week to week history.
- A smoke test boots the production build and verifies the Strict-Transport-Security, X-Frame-Options, and X-Content-Type-Options headers configured in `next.config.mjs`.
- Husky with lint-staged runs Prettier and ESLint before every commit; keep branch protection on `main` so merges require a passing `CI` run.

---

## 🎨 Design Tokens & Styles

- Tokens are defined as CSS variables in `app/globals.css`.
- Tailwind (`tailwind.config.mjs`) maps tokens to classes.
- Cards use a white background with thin Bucks green borders; pass `accent="great-lakes-blue"` and `thickness="thick"` to `Card` for the special blue-bordered case.
- Desktop tables use the shared `Table` component with `.zebra-desktop` striping.
- For form fields; apply the `form-input` class to reuse border and padding.
- Use them like this:

```jsx
<div className="bg-background text-foreground border-border">
  Hello world with tokens!
</div>
```

This keeps typography, colors, and spacing consistent across the site.

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

Images are resized to a **1920px** max width and exported as **JPG, WebP, AVIF, PNG**.

---

## 📝 Authoring Static Pages

See [docs/authoring.md](docs/authoring.md) for the quickest way to scaffold and validate a new page.

---

## 🌐 SEO & Crawl Directives

Robots and sitemap metadata routes live in `app/robots.ts` and `app/sitemap.ts`, providing baseline crawl directives and a simple sitemap for top-level pages.

---

## 🗃️ Database

This project requires a **Postgres** database.

- `DATABASE_URL` – runtime connection string
- `TEST_DATABASE_URL` – local tests

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

We run Secretlint in CI to prevent accidental secret commits.

Apply release helper functions:

```bash
psql $DATABASE_URL -f db/migrations/002_fn_next_release_functions.sql
psql $DATABASE_URL -f db/migrations/003_semver_columns.sql
```

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

Recommended Node version: **20**.

- `npm run lint` – lint the codebase
- `npm run typecheck` – run TypeScript checks
- `npm run format:check` – verify formatting without writing changes
- `npm run deadcode` – list unused exports
- `npm run build` – build the production bundle
- `npm run start` – start the production server
- `npm run db:ping` – verify DB connectivity (SELECT 1)
- `npm run check:use-server` – flag invalid `"use server"` exports

---

## 🧪 CI

Pull requests run two GitHub Actions checks:

- **Build & Check** – lint, typecheck, image checks, and build
- **E2E Tests** – Playwright end-to-end suite

---

## Running E2E

**Cache-first (recommended):**

```bash
npm ci
npm run test:e2e:install
npm run test:e2e
```

**System-Chrome fallback:**

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

- Static pages: `app/roadwork-rappin`, `app/heels-have-eyes`, `app/ui-lab`, `app/typography-demo`
- `globals.css`: design tokens + Tailwind entry point
- `tailwind.config.mjs`: maps tokens → Tailwind theme
- Set `NEXT_PUBLIC_ANNOUNCEMENT` to display the top banner
- Always run `npm run images:optimize` before committing new images
- `app/shaolin-scrolls`: responsive release list with Radix details dialog
- `app/page.tsx`: homepage with Mother's Day 2025, Musical Guests, Chronicle of Chronicles, and Shaolin Scrolls sections
- `app/credits`: sources & acknowledgments via Flowers
- Security headers configured in `next.config.mjs` enforce HSTS, deny framing, and prevent MIME sniffing.
