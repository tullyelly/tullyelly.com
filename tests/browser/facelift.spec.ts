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
        "next/navigation": path.resolve(
          "tests/browser/fixtures/directory-navigation.ts",
        ),
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

for (const width of [375, 1440])
  test(`Homie directory and profile return at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page);
    await page.goto(
      "http://directory.test/cardattack/homies?q=greek&sort=name",
    );
    await expect(page.getByRole("searchbox")).toHaveValue("greek");
    await expect(page.getByRole("status").first()).toContainText("1 homie");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`homies-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", {
        name: "Giannis Antetokounmpo with a very long display name",
        exact: true,
      })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Giannis",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`homie-detail-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Back to homies", exact: true })
      .click();
    await expect(page.getByRole("searchbox")).toHaveValue("greek");
    await expect(page.getByLabel("Sort homies")).toHaveValue("name");
  });

for (const width of [375, 1440])
  test(`Clan server-query fixture and multi-sport profile at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page);
    await page.goto("http://directory.test/cardattack/clans?q=bucks");
    await page.getByLabel("Filter by sport").selectOption("basketball");
    await expect(page).toHaveURL(/sport=basketball/);
    await page.getByLabel("Sort clans").selectOption("rank");
    await expect(page).toHaveURL(/sort=rank/);
    await page.screenshot({
      path: info.outputPath(`clans-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "View TCDB details for Milwaukee Bucks" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Basketball", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Football", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`clan-detail-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Back to clans" }).click();
    await expect(page.getByLabel("Filter by sport")).toHaveValue("basketball");
    await expect(page.getByLabel("Sort clans")).toHaveValue("rank");
    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "Football", exact: true }),
    ).toBeVisible();
  });

for (const width of [375, 1440]) {
  test(`Fam aliases, pagination, embedded detail and return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "unclejimmy/fam?page=2");
    await expect(
      page.getByRole("heading", { name: "Fam 30", exact: true }),
    ).toBeVisible();
    await page.getByRole("searchbox").fill("bonnie");
    await page
      .getByRole("combobox", { name: "Sort Fam" })
      .selectOption("name-desc");
    await page.getByRole("link", { name: /Bonnibel/ }).click();
    await expect(page.getByTitle("Family document fixture")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`fam-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Back to Fam" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("bonnie");
    await expect(page.getByRole("combobox", { name: "Sort Fam" })).toHaveValue(
      "name-desc",
    );
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("");
  });
  test(`Volleyball search, detail and return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "unclejimmy/squad/volleyball?page=2");
    await page.getByRole("searchbox").fill("Tournament 01");
    await page
      .getByRole("combobox", { name: "Sort tournaments" })
      .selectOption("name");
    await expect(
      page.getByText("Not tracked").filter({ visible: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`volleyball-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Tournament 01" })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to tournaments" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Tournament 01");
  });
}

for (const width of [375, 1440]) {
  test(`Crates filtering, unclassified artist and source return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "theabbott/crates?page=2");
    await page.getByRole("searchbox").fill("unclassified");
    await page
      .getByRole("combobox", { name: "Appearance type" })
      .selectOption("video");
    await page
      .getByRole("combobox", { name: "Sort music" })
      .selectOption("title");
    await expect(page.getByText("1 appearance", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`crates-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: /An unclassified artist/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/shaolin\/tags\/unclassified-artist/);
    await page.getByRole("link", { name: "Back to Crates" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("unclassified");
    await page
      .getByRole("link", { name: "Source Chronicle 1", exact: true })
      .click();
    await page.getByRole("link", { name: "Back to Crates" }).click();
    await expect(
      page.getByRole("combobox", { name: "Appearance type" }),
    ).toHaveValue("video");
    await page.getByRole("searchbox").fill("not-found-xyz");
    await expect(
      page.getByRole("heading", { name: "No music matches these filters." }),
    ).toBeVisible();
  });
}

for (const width of [375, 1440]) {
  test(`Category URL state, zero measurement and return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "cardattack/categories?page=2");
    await page.getByRole("searchbox").fill("Category 01");
    await page
      .getByRole("combobox", { name: "Sort categories" })
      .selectOption("date");
    await page.getByRole("link", { name: "Category 01" }).click();
    await expect(page.getByText("Nov 28, 2026: 0 cards")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`category-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Back to categories" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Category 01");
    await expect(
      page.getByRole("combobox", { name: "Sort categories" }),
    ).toHaveValue("date");
  });
  test(`Set controls, unknown progress and detail return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "cardattack/set-collector");
    await expect(
      page.getByText("No snapshot yet").filter({ visible: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Filter tracked sets by category" })
      .selectOption("non-sport");
    await page.getByRole("searchbox").fill("Set 01");
    await page
      .getByRole("link", { name: "Set 01", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page.getByRole("heading", { name: "Set 01" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Snapshot History" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`set-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: /Back to Set Collector/ }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Set 01");
    await expect(
      page.getByRole("combobox", { name: "Filter tracked sets by category" }),
    ).toHaveValue("non-sport");
  });
}
