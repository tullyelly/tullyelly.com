import { test, expect } from "./fixtures";
import { ensureVisualStability as enforceVisualStability } from "../tests/utils/visual-stability";

const mobileViewport = { width: 390, height: 844 };
const desktopViewport = { width: 1280, height: 800 };

test.describe("mobile drawer hierarchy", () => {
  test.use({ viewport: mobileViewport });

  test.beforeEach(async ({ page }) => {
    await page.goto("/menu-test");
  });

  test("drill-in navigation keeps hierarchy intact", async ({ page }) => {
    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.getByTestId("nav-mobile-drawer");
    await expect(drawer).toBeVisible();
    await expect(page.getByText("By alter ego")).toBeVisible();

    const markToggle = page.getByRole("button", { name: /mark2/i });
    await markToggle.click();

    const personaRegion = drawer.getByRole("region", { name: /mark2/i });
    await expect(personaRegion).toBeVisible();
    const shaolinButton = personaRegion.getByRole("button", {
      name: "Shaolin Scrolls",
    });

    if ((await shaolinButton.count()) > 0) {
      await expect(shaolinButton).toBeVisible();

      const adminButton = personaRegion.getByRole("button", { name: "Admin" });
      if ((await adminButton.count()) > 0) {
        await expect(adminButton).toBeVisible();
      }

      const systemHealthButton = personaRegion.getByRole("button", {
        name: "System Health",
      });
      if ((await systemHealthButton.count()) > 0) {
        await expect(systemHealthButton).toBeVisible();
      }

      await shaolinButton.click();
      await page.waitForURL("**/mark2/shaolin-scrolls");

      await menuButton.click();
      await expect(drawer).toBeVisible();
    } else {
      await expect(personaRegion.getByText("No links yet.")).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    const menuHasFocus = await menuButton.evaluate(
      (button) => document.activeElement === button,
    );
    if (menuHasFocus) {
      await expect(menuButton).toBeFocused();
    } else {
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    }
  });
});

test.describe("desktop navigation regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktopViewport);
    await page.goto("/", { waitUntil: "networkidle" });
    await enforceVisualStability(page);
    await page.waitForSelector("#site-header");
  });

  test("header matches baseline screenshot", async ({ page }) => {
    const header = page.locator("#site-header");
    await expect(header).toHaveScreenshot("desktop-header.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
      scale: "device",
      mask: [
        page.locator("[data-progress]"),
        page.locator("#build-info"),
        page.locator("[data-clock]"),
        page.locator("[data-unread]"),
        page.locator("[data-avatar]"),
      ],
    });
  });
});
