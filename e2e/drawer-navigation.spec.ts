import { test, expect } from "./fixtures";
import { ensureVisualStability as enforceVisualStability } from "../tests/utils/visual-stability";
import { waitAppReady } from "../tests/utils/waitAppReady";

const desktopViewport = { width: 1280, height: 800 };

function isTruthyFlag(value: string | undefined): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !["0", "false", "no"].includes(normalized);
}

const stubMenuEnabled =
  isTruthyFlag(process.env.NEXT_PUBLIC_TEST_MODE) ||
  isTruthyFlag(process.env.TEST_MODE);

test.describe("mobile drawer hierarchy", () => {
  test("drill-in navigation keeps hierarchy intact", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobi",
      "This scenario only runs in the mobile Playwright project.",
    );

    const baseUrl =
      process.env.PLAYWRIGHT_TEST_BASE_URL ??
      process.env.BASE_URL ??
      "http://127.0.0.1:4321";

    await page.goto("/");
    await waitAppReady(baseUrl);

    const drawer = page.getByTestId("nav-mobile-drawer");

    const resolveMenuTrigger = async () => {
      const byRole = page.getByRole("button", { name: /menu/i });
      const byTestId = page.getByTestId("nav-mobile-trigger");

      await expect(async () => {
        const [roleVisible, testIdVisible] = await Promise.all([
          byRole.isVisible().catch(() => false),
          byTestId.isVisible().catch(() => false),
        ]);

        if (!roleVisible && !testIdVisible) {
          throw new Error("Menu trigger not yet visible");
        }
      }).toPass();

      const roleVisible = await byRole.isVisible().catch(() => false);
      return roleVisible ? byRole : byTestId;
    };

    const menuTriggerInitial = await resolveMenuTrigger();
    await menuTriggerInitial.click();

    await expect(drawer).toBeVisible();
    await expect(page.getByText("By alter ego")).toBeVisible();

    const markToggle = page.getByRole("button", { name: /mark2/i });
    await markToggle.click();

    const personaRegion = drawer.getByRole("region", { name: /mark2/i });
    await expect(personaRegion).toBeVisible();
    const shaolinButton = personaRegion.getByRole("button", {
      name: "Shaolin Scrolls",
    });

    let lastTrigger = menuTriggerInitial;

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
      await page.waitForURL((url) => {
        const path = url.pathname.replace(/\/+$/, "");
        return (
          path.endsWith("/menu-test/target") ||
          path.endsWith("/mark2/shaolin-scrolls")
        );
      });

      const menuTriggerAfterNav = await resolveMenuTrigger();
      await menuTriggerAfterNav.click();
      await expect(drawer).toBeVisible();
      lastTrigger = menuTriggerAfterNav;
    } else {
      await expect(personaRegion.getByText("No links yet.")).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    const triggerHasFocus = await lastTrigger
      .evaluate((button) => document.activeElement === button)
      .catch(() => false);

    if (triggerHasFocus) {
      await expect(lastTrigger).toBeFocused();
    } else {
      await expect(lastTrigger).toHaveAttribute("aria-expanded", "false");
    }
  });
});

test.describe("desktop navigation regression", () => {
  test.skip(
    stubMenuEnabled,
    "Header baseline only applies when full menu data is available.",
  );

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
