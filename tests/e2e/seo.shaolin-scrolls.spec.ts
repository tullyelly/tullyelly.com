import { test, expect } from "./fixtures";

test("shaolin-scrolls list emits metadata", async ({ page }) => {
  await page.goto("/mark2/shaolin-scrolls?q=alpha&page=2");
  await expect(page).toHaveTitle(/Shaolin Scrolls; search: "alpha"; page 2/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /filtered by "alpha".*page 2/i,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Shaolin Scrolls/,
  );
});

test("shaolin-scrolls detail emits metadata", async ({ page }) => {
  await page.goto("/mark2/shaolin-scrolls/1");
  await expect(page).toHaveTitle(/Scroll 1/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Scroll 1/,
  );
});
