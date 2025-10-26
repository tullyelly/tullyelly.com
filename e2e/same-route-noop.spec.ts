import { test, expect } from "./fixtures";

test.describe("Same-route navigation guard", () => {
  test("desktop: clicking Home on current route is a noop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("#site-header");

    const urlBefore = page.url();
    await page.click("[data-nav-home]");
    await page.waitForTimeout(250);

    await expect(page).toHaveURL(urlBefore);
    await expect(page.locator("#site-header")).toBeVisible();

    const potentialLoader = page.locator(
      "[data-progress], [data-loading-overlay]",
    );
    if ((await potentialLoader.count()) > 0) {
      await expect(potentialLoader).toBeHidden();
    }
  });

  test("mobile: tapping current-route item closes drawer without loading", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.getByTestId("nav-mobile-drawer");
    await expect(drawer).toBeVisible();

    const urlBefore = page.url();
    const homeLink = drawer.getByRole("link", { name: /^home$/i });
    await homeLink.click();
    await page.waitForTimeout(250);

    await expect(page).toHaveURL(urlBefore);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(drawer).toBeHidden();

    const potentialLoader = page.locator(
      "[data-progress], [data-loading-overlay]",
    );
    if ((await potentialLoader.count()) > 0) {
      await expect(potentialLoader).toBeHidden();
    }
  });
});
