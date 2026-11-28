import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

let script: string;
let css: string;
test.beforeAll(async () => {
  const { build } = await import("vite");
  const { default: tailwind } = await import("@tailwindcss/postcss");
  const result = await build({
    configFile: false,
    css: { postcss: { plugins: [tailwind()] } },
    resolve: {
      alias: {
        "@/lib/cn": path.resolve("app/lib/cn.ts"),
        "@": process.cwd(),
        "@ui": path.resolve("components/ui"),
      },
    },
    esbuild: { jsx: "automatic" },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env": "{}",
    },
    build: {
      write: false,
      lib: {
        entry: path.resolve("tests/browser/fixtures/directory.tsx"),
        name: "Directory",
        formats: ["iife"],
      },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (!("output" in bundle)) throw new Error("Missing fixture bundle");
  script = bundle.output
    .filter((x) => x.type === "chunk")
    .map((x) => x.code)
    .join("\n");
  css = bundle.output
    .flatMap((x) =>
      x.type === "asset" && x.fileName.endsWith(".css")
        ? [String(x.source)]
        : [],
    )
    .join("\n");
});
async function mount(page: Page, query = "") {
  await page.route("http://directory.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Directory</title><style>${css}</style><div id="root"></div><script>${script}</script></html>`,
    }),
  );
  await page.goto(`http://directory.test/${query}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
test("reload, search, sort, page size and browser history preserve public state", async ({
  page,
}) => {
  await mount(page, "?page=2");
  await expect(page.locator("#results li").first()).toHaveText("Homie 26");
  await page.getByRole("searchbox").fill("Homie");
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByLabel("Sort", { exact: true }).selectOption("reverse");
  await expect(page.locator("#results li").first()).toHaveText("Homie 60");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator("#results li").first()).toHaveText("Homie 35");
  await page.goBack();
  await expect(page.locator("#results li").first()).toHaveText("Homie 60");
  await page.goForward();
  await expect(page.locator("#results li").first()).toHaveText("Homie 35");
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveValue("Homie");
  await expect(page.locator("#results li").first()).toHaveText("Homie 35");
  await page.getByLabel("Rows per page").selectOption("50");
  await expect(page.locator("#results li")).toHaveCount(50);
  await expect(page.locator("#results li").first()).toHaveText("Homie 60");
  await page.getByRole("searchbox").fill("missing");
  await expect(page.getByRole("heading", { name: "No matches" })).toBeVisible();
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator("#results li")).toHaveCount(50);
});
for (const width of [375, 768, 1440])
  test(`responsive layouts and state headings at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "?page=999&sort=invalid&pageSize=bad");
    await expect(page.locator("#results li").first()).toHaveText("Homie 51");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "On this page" }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`directory-${width}.png`),
      fullPage: true,
    });
  });
