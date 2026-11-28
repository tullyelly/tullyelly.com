import { build } from "vite";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const result = await build({
  configFile: false,
  css: { postcss: { plugins: [tailwind()] } },
  esbuild: { jsx: "automatic" },
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    write: false,
    lib: {
      entry: "docs/facelift/preview.tsx",
      name: "FaceliftPreview",
      formats: ["iife"],
    },
  },
});
const output = (Array.isArray(result) ? result[0] : result).output;
const js = output
  .filter((x) => x.type === "chunk")
  .map((x) => x.code)
  .join("\n");
const css = output
  .filter((x) => x.type === "asset" && x.fileName.endsWith(".css"))
  .map((x) => x.source)
  .join("\n");
await fs.mkdir(".cache/facelift", { recursive: true });
await fs.writeFile(
  ".cache/facelift/preview.html",
  `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Facelift design</title><style>${css}</style><div id="root"></div><script>${js}</script></html>`,
);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_PATH,
  headless: true,
  args: ["--no-sandbox"],
});
for (const width of [375, 1440])
  for (const view of ["directory", "athlete", "clan", "fam", "music", "set"]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.route("http://facelift.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div></html>',
      }),
    );
    await page.goto(`http://facelift.test/?view=${view}`);
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: js });
    await page.locator("h1").waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw Error(`Overflow: ${view} ${width}`);
    await page.screenshot({
      path: `.cache/facelift/${view}-${width}.png`,
      fullPage: true,
    });
    await page.close();
  }
await browser.close();
console.log(
  "12 design captures produced; no horizontal overflow at 375px or 1440px.",
);
