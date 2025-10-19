import { expect, test } from "@playwright/test";
import { ensureReady, navigateToSlug } from "../e2e/utils/ui";

test.describe("global breadcrumb", () => {
  test("renders correct ancestors on initial load", async ({ page }) => {
    await page.goto("/mark2/shaolin-scrolls");
    await ensureReady(page);

    const nav = page.locator('[data-testid="breadcrumb"]');
    await expect(nav).toBeVisible();
    await expect(nav).toContainText(/home/i);
    await expect(nav).toContainText(/mark2/i);
    const links = nav.locator("a");
    await expect(links.first()).toHaveAttribute("href", "/");
    await expect(links.nth(1)).toHaveAttribute("href", "/mark2");
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /shaolin scrolls/i,
    );
  });

  test("updates immediately on client navigation", async ({ page }) => {
    await page.goto("/");
    await ensureReady(page);

    const nav = page.locator('[data-testid="breadcrumb"]');
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/home/i);

    await navigateToSlug(page, "mark2");
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/mark2/i);
    await expect(nav.locator("a").first()).toHaveAttribute("href", "/");

    await navigateToSlug(page, "cardattack");
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      /cardattack/i,
    );
    await expect(nav.locator("a").first()).toHaveAttribute("href", "/");
  });
});
