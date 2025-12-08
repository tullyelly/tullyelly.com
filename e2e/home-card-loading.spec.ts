import { test, expect } from "./fixtures";

test.describe("Home card row loading affordance", () => {
  test("clicking a home card row shows loading state before navigation", async ({
    page,
  }) => {
    await page.route("**/mark2**", async (route) => {
      await page.waitForTimeout(250);
      await route.continue();
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const row = page.locator('[data-href="/mark2"]');
    await expect(row).toBeVisible();

    const navPromise = page.waitForNavigation({ url: /\/mark2/ });
    await row.click();

    await expect(row).toHaveAttribute("data-loading", "true");
    await expect(row.locator("[data-spinner]")).toBeVisible();

    await navPromise;
  });
});
