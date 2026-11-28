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
        ...(process.env.FACELIFT_BASELINE_DIR
          ? Object.fromEntries(
              [
                "app/cardattack/homies/_components/HomieDirectory",
                "components/tcdb/RankingDetailPage",
                "app/shaolin/_components/ChronicleListClient",
              ].map((module) => [
                `@/${module}`,
                path.join(process.env.FACELIFT_BASELINE_DIR!, `${module}.tsx`),
              ]),
            )
          : {}),
        "@/lib/cn": path.resolve("app/lib/cn.ts"),
        "next-auth/react": path.resolve(
          "tests/browser/fixtures/navigation-session.ts",
        ),
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

for (const width of [375, 1440]) {
  for (const route of [
    "cardattack/lcs",
    "cardattack/usps",
    "unclejimmy/bricks",
    "unclejimmy/call-a-save-point",
    "unclejimmy/golden-age",
    "unclejimmy/table-schema",
  ]) {
    test(`${route} configured tracker return at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await mount(page, `${route}?page=2`);
      await page.getByRole("searchbox").fill("Fixture 01");
      const sort = page.getByRole("combobox", { name: /^Sort / });
      await sort.selectOption(
        route.includes("lcs") ||
          route.includes("usps") ||
          route.includes("bricks")
          ? "name"
          : "a-z",
      );
      await expect(
        page
          .getByRole("link", { name: "Fixture 01", exact: true })
          .filter({ visible: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`tracker-${width}.png`),
        fullPage: true,
      });
      await page
        .getByRole("link", { name: "Fixture 01", exact: true })
        .filter({ visible: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Chronicle Feed" }),
      ).toBeVisible();
      await page.getByRole("link", { name: /Back to directory/ }).click();
      await expect(page.getByRole("searchbox")).toHaveValue("Fixture 01");
      await page.getByRole("button", { name: "Clear filters" }).click();
      await expect(page.getByRole("searchbox")).toHaveValue("");
    });
  }
}

for (const width of [375, 1440]) {
  test(`Trade and partner stateful journeys at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "cardattack/tcdb-trades?page=2");
    await page.getByRole("searchbox").fill("Partner 01");
    await page
      .getByRole("combobox", { name: "Filter TCDb trades by status" })
      .selectOption("Completed");
    await page
      .getByRole("link", { name: "Partner 01", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("link", { name: "Back to trades", exact: true })
      .click();
    await expect(page.getByRole("searchbox")).toHaveValue("Partner 01");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`trades-${width}.png`),
      fullPage: true,
    });
    await page.goto(
      "http://directory.test/cardattack/tcdb-trade-partners?recognition=hall-of-fame&page=2",
    );
    await page.getByRole("searchbox").fill("Partner 01");
    await page
      .getByRole("link", { name: "Partner 01", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to directory" }).click();
    await expect(
      page.getByRole("combobox", {
        name: "Filter trade partners by recognition",
      }),
    ).toHaveValue("hall-of-fame");
  });
  test(`Hall of Fame induction view and set return at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mount(page, "cardattack/hof");
    await page
      .getByRole("combobox", { name: "Hall of Fame view" })
      .selectOption("inductions");
    await page.getByRole("searchbox").fill("Set 01");
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Hall of Fame view" }),
    ).toHaveValue("inductions");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`hof-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Set 01", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to Hall of Fame" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Set 01");
  });
}

for (const width of [375, 1440]) {
  test(`archive search, tag return and history at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "shaolin?page=2");
    await page.getByRole("searchbox").fill("Archive Chronicle");
    await expect(page).not.toHaveURL(/page=2/);
    await page.getByRole("button", { name: "Next page" }).click();
    await page
      .getByRole("link", { name: "Archive Chronicle 19", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to Chronicles" }).click();
    await expect(page).toHaveURL(/page=2/);
    await page.reload();
    await expect(page.getByRole("searchbox")).toHaveValue("Archive Chronicle");
    await page
      .getByRole("link", { name: "#archive-tag", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "#archive-tag",
    );
    await page.getByRole("link", { name: "Back to Chronicles" }).click();
    await page.getByRole("searchbox").fill("absent");
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("");
    await page.screenshot({
      path: info.outputPath(`archives-${width}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("http://directory.test/shaolin/tags?q=Authored");
    await page
      .getByRole("link", { name: "Fam page" })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to tag directory" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Authored");
  });
  test(`scroll server controls and safe detail return at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "mark2/shaolin-scrolls");
    await page.getByRole("searchbox").fill("Release");
    await page
      .getByRole("combobox", { name: "Sort scrolls" })
      .selectOption("semver:asc");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await page
      .getByRole("link", { name: "View release 26 details" })
      .filter({ visible: true })
      .click();
    await page.getByRole("link", { name: "Back to Shaolin Scrolls" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("searchbox")).toHaveValue("Release");
    await page.screenshot({
      path: info.outputPath(`scrolls-${width}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

for (const width of [375, 1440]) {
  test(`persona discovery and navigation overlays at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "navigation-fixture");
    const apps = page.getByRole("navigation", {
      name: "cardattack applications",
    });
    await expect(apps.getByRole("link", { name: /Homies/ })).toHaveAttribute(
      "href",
      "/cardattack/homies",
    );
    await expect(page.getByRole("link", { name: /^admin$/i })).toHaveCount(0);
    if (width < 768) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page
        .getByRole("button", { name: "cardattack", exact: true })
        .click();
      await expect(
        page.getByRole("dialog").getByText("Local Card Shops", { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`navigation-${width}.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Close menu" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      const menu = page.getByTestId("nav-desktop-menu");
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(
        page
          .getByRole("link", { name: "Local Card Shops", exact: true })
          .first(),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`navigation-${width}.png`),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
    }
    await page.getByRole("button", { name: "Search applications" }).focus();
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder(/find a page/i).fill("Homies");
    await expect(
      page.getByRole("option", { name: "Homies cardattack", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("option", { name: "Homies theabbott", exact: true }),
    ).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Search applications" }),
    ).toBeFocused();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await apps.getByRole("link", { name: /Homies/ }).click();
    await expect(page).toHaveURL(/cardattack\/homies/);
  });
}

for (const width of [375, 1440]) {
  test(`visual comparison at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "cardattack/homies");
    await page.screenshot({ path: info.outputPath(`homies-${width}.png`) });
    await page.goto("http://directory.test/cardattack/homies/homie-1");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`profile-${width}.png`) });
    await page.goto("http://directory.test/shaolin");
    await expect(page.getByRole("searchbox")).toBeVisible();
    await page.screenshot({ path: info.outputPath(`chronicles-${width}.png`) });
  });
}

for (const width of [320, 768]) {
  test(`reflow across route families at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await mount(page, "cardattack/homies/homie-1");
    for (const route of [
      "cardattack/homies/homie-1",
      "unclejimmy/fam",
      "theabbott/crates",
      "shaolin",
      "mark2/shaolin-scrolls",
    ]) {
      await page.goto(`http://directory.test/${route}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}
