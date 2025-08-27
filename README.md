# tullyelly.com

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

## 🎨 Design Tokens & Styles

* Tokens are defined as CSS variables in `app/globals.css`.
* Tailwind (`tailwind.config.mjs`) maps tokens to classes.
* Use them like this:

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

## 🗃️ Database

This project requires a **Postgres** database.

- `DATABASE_URL` – runtime connection string (falls back to `NEON_DATABASE_URL`)
- `TEST_DATABASE_URL` – local tests

For tests, create a `.env.test` file so `npm test` can load a dedicated database URL:

```bash
# .env.test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/tullyelly_test
```

Using a Neon branch instead of local Postgres? Point `TEST_DATABASE_URL` at the branch URL:

```bash
TEST_DATABASE_URL=postgresql://…@ep-round-forest-aeuxacm9.c-2.us-east-2.aws.neon.tech/tullyelly_db?sslmode=require&channel_binding=require
```

Apply release helper functions:

```bash
psql $DATABASE_URL -f db/migrations/002_fn_next_release_functions.sql
```

Verify connectivity:

The `/api/releases` endpoint supports `status` and `type` query params (comma-separated) for filtering.

```bash
curl -s http://localhost:3000/api/_health
curl -s "http://localhost:3000/api/releases?limit=5&offset=0&sort=created_at:desc"
curl -s "http://localhost:3000/api/releases?status=released&type=hotfix,minor"
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"label":"Test patch"}' http://localhost:3000/api/releases/patch # mutates data
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"label":"Test minor"}' http://localhost:3000/api/releases/minor # mutates data
```

---

## 📜 Scripts

Recommended Node version: **20**.

* `npm run lint` – lint the codebase
* `npm run typecheck` – run TypeScript checks
* `npm run build` – build the production bundle
* `npm run start` – start the production server
* `npm run ci` – run lint, image checks, and build

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

## 📚 Learn More

* [Next.js Documentation](https://nextjs.org/docs)
* [Tailwind CSS Docs](https://tailwindcss.com/docs)
* [Sharp Image Processing](https://sharp.pixelplumbing.com/)
* [Imagemin](https://github.com/imagemin/imagemin)

---

## ☁️ Deployment

Deploy easily with [Vercel](https://vercel.com/new).
This repo is already structured for one-click deploys.

---

## ✅ Quick Notes

* Static pages: `app/roadwork-rappin`, `app/heels-have-eyes`, `app/ui-lab`, `app/typography-demo`
* `globals.css`: design tokens + Tailwind entry point
* `tailwind.config.mjs`: maps tokens → Tailwind theme
* Set `NEXT_PUBLIC_ANNOUNCEMENT` to display the top banner
* Always run `npm run images:optimize` before committing new images
* `app/scrolls`: responsive grid layout with sidebar and table scaffold
