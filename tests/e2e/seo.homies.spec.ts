import { test, expect } from "./fixtures";

test("homies list emits metadata", async ({ page }) => {
  await page.goto("/cardattack/homies?q=giannis&page=2");
  await expect(page).toHaveTitle(
    /cardattack; homies; search: "giannis"; page 2/i,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /filtered by "giannis".*page 2/i,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /homies/i,
  );
});

test("homie detail emits metadata", async ({ page }) => {
  await page.goto("/cardattack/homies");
  const href = await page
    .locator('[data-testid="ranking-detail-trigger"]')
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href as string);
  await expect(page).toHaveTitle(/Jersey \d+/i);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Jersey \d+/i,
  );
});
