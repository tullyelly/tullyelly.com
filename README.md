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

This project requires a **Postgres** database. Set the `DATABASE_URL` environment variable to point to your instance.

After configuring the database, run:

```bash
npx prisma migrate dev
npx prisma db seed
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

* Static pages: `app/roadwork-rappin`, `app/heels-have-eyes`
* `globals.css`: design tokens + Tailwind entry point
* `tailwind.config.mjs`: maps tokens → Tailwind theme
* Always run `npm run images:optimize` before committing new images
