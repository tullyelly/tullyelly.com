import { test, expect } from "./fixtures";

const mobileViewport = { width: 390, height: 844 };
const desktopViewport = { width: 1280, height: 800 };

test.describe("mobile drawer hierarchy", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/menu-test");
  });

  test("drill-in navigation keeps hierarchy intact", async ({ page }) => {
    const menuButton = page.getByRole("button", { name: "Menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.getByTestId("nav-mobile-drawer");
    await expect(drawer).toBeVisible();
    await expect(page.getByText("By Persona")).toBeVisible();

    const markChevron = page.getByLabel("View mark2 links");
    await markChevron.click();

    await expect(
      page.getByRole("button", { name: "Shaolin Scrolls" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Admin" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "System Health" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Shaolin Scrolls" }).click();
    await page.waitForURL("**/shaolin-scrolls");

    await menuButton.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});

test.describe("desktop navigation regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktopViewport);
    await page.goto("/menu-test");
    await page.waitForSelector("#site-header");
  });

  test("header matches baseline screenshot", async ({ page }) => {
    const header = page.locator("#site-header");
    await expect(header).toHaveScreenshot("desktop-header.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
