📖 Project README (Updated)
tullyelly.com

This is a Next.js
 project bootstrapped with create-next-app
, customized with Tailwind v4 design tokens and an automated image pipeline.

🚀 Getting Started
Run the development server
npm run dev


Then open http://localhost:3000
 in your browser.
The page auto-updates as you edit files inside the app/ folder.

🎨 Design Tokens & Styles

We use Tailwind v4 with custom design tokens defined in app/globals.css.

Tokens are CSS variables (e.g. --color-background, --color-foreground).

They’re hooked into Tailwind via tailwind.config.mjs.

Use them in components with standard Tailwind classes:

<div className="bg-background text-foreground border-border">
  Hello world with tokens!
</div>


This keeps typography, colors, and spacing consistent across pages.

🖼️ Image Optimization Pipeline

Large images slow down the site. We use an automated pipeline powered by sharp
 and imagemin
.

Workflow

Place your original images into:

public/images/source/


Run the pipeline:

npm run images


Optimized images will be created in:

public/images/optimized/


Each image is resized to 1200px and 600px widths and exported in WebP, AVIF, and JPG formats.

Scripts available

npm run images → process new images.

npm run clean:images → clear out optimized outputs.

📚 Learn More

Next.js Documentation

Tailwind CSS

Sharp Image Processing

☁️ Deployment

The easiest way to deploy is the Vercel Platform
.
This project is already structured for one-click deploys.

✅ Quick Notes

Static pages live under app/ (e.g. /roadwork-rappin, /heels-have-eyes).

globals.css = design tokens + Tailwind entry point.

tailwind.config.mjs = maps tokens → Tailwind theme.

Always run npm run images before committing new images.