# tullyelly.com

A [Next.js](https://nextjs.org) project customized with **Tailwind v4 design tokens** and an **image optimization pipeline**.

---

## 🚀 Getting Started

Run the development server:

```bash
npm run dev
````

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

2. Run the pipeline:

   ```bash
   npm run images
   ```

3. Optimized images are saved to:

   ```
   public/images/optimized/
   ```

Images are resized (1200px, 600px) and exported as **WebP, AVIF, JPG**.

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
* Always run `npm run images` before committing new images

```