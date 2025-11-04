import { test, expect } from "@playwright/test";

test("credits page renders Flowers heading and aria-labeled element", async ({
  page,
}) => {
  await page.goto("/credits", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#site-header", { timeout: 60_000 });
  await page.waitForSelector("main", { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: /Flowers/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Acknowledgments" }),
  ).toBeVisible();
});

test("home page shows Flowers inline notes for sections", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#site-header", { timeout: 60_000 });
  await page.waitForSelector("main", { timeout: 60_000 });
  await page
    .getByRole("link", { name: "tullyelly ruins" })
    .click({ force: true });
  const ack = page
    .getByTestId("flowers-ack")
    .filter({ hasText: /chronicles/i })
    .first();
  await ack.waitFor({ state: "visible", timeout: 20_000 });
  await expect(ack).toContainText(/chronicles/i);
  await expect(
    page.getByLabel("Acknowledgments").filter({
      hasText: "PostgreSQL, Neon & DataGrip; rekindled my database crush.",
    }),
  ).toBeVisible();
});

test("mark2 shaolin scrolls page omits Flowers inline notes", async ({
  page,
}) => {
  await page.goto("/mark2/shaolin-scrolls", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#site-header", { timeout: 60_000 });
  await page.waitForSelector("main", { timeout: 60_000 });
  await expect(page.getByLabel("Acknowledgments")).toHaveCount(0);
});
