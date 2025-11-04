import "./setup";
import { test, expect } from "./fixtures";

test.describe("Same-route navigation guard", () => {
  test("desktop: clicking Home on current route is a noop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector("#site-header", { timeout: 60_000 });
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
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector("#site-header", { timeout: 60_000 });
    await page.waitForFunction(
      () =>
        // @ts-expect-error E2E-only hook
        typeof window.__navTest?.openMobileDrawer === "function",
      { timeout: 10_000 },
    );

    await page.evaluate(async () => {
      // @ts-expect-error injected for E2E only
      await window.__navTest?.openMobileDrawer?.();
    });
    await page.waitForFunction(
      () =>
        // @ts-expect-error injected for E2E only
        window.__navTest?.isMobileDrawerOpen?.() === true,
      { timeout: 10_000 },
    );
    const drawer = page
      .locator(
        [
          '[data-vaul-drawer][data-state="open"]',
          '#nav-mobile-drawer[data-state="open"]',
          "[data-vaul-drawer-content]",
          '[role="dialog"][data-state="open"]',
        ].join(", "),
      )
      .first();
    await page.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const rect = (el as HTMLElement).getBoundingClientRect?.();
        const style = getComputedStyle(el as Element);
        return (
          !!rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden"
        );
      },
      [
        '[data-vaul-drawer][data-state="open"]',
        '#nav-mobile-drawer[data-state="open"]',
        "[data-vaul-drawer-content]",
        '[role="dialog"][data-state="open"]',
      ].join(", "),
      { timeout: 10_000 },
    );

    const urlBefore = page.url();
    const homeLink =
      (await drawer.getByRole("link", { name: /^home$/i }).count()) > 0
        ? drawer.getByRole("link", { name: /^home$/i }).first()
        : drawer.locator('a[href="/"]').first();
    await homeLink.waitFor({ state: "visible", timeout: 10_000 });
    await homeLink.click();
    await page.waitForTimeout(250);

    await expect(page).toHaveURL(urlBefore);
    await page.waitForFunction(
      () =>
        // @ts-expect-error injected for E2E only
        window.__navTest?.isMobileDrawerOpen?.() === false,
      { timeout: 20_000 },
    );
    await page.evaluate(async () => {
      // @ts-expect-error injected for E2E only
      await window.__navTest?.closeMobileDrawer?.();
    });
    await expect(drawer).toBeHidden({ timeout: 20_000 });

    const potentialLoader = page.locator(
      "[data-progress], [data-loading-overlay]",
    );
    if ((await potentialLoader.count()) > 0) {
      await expect(potentialLoader).toBeHidden();
    }
  });
});
