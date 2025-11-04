import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

async function tapTouch(page: Page, locator: Locator) {
  await locator.waitFor({ state: "visible", timeout: 5_000 });
  const handle = await locator.elementHandle();
  if (!handle) throw new Error("tapTouch: no element handle");

  await page.evaluate((node: Element) => {
    const el = node as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;

    const common = { bubbles: true, cancelable: true, composed: true };

    const touch = (type: string) => {
      const win = window as typeof window & {
        TouchEvent?: typeof window.TouchEvent;
        Touch?: typeof window.Touch;
      };
      if (typeof win.TouchEvent !== "function") return;

      const touchInit = { identifier: 1, target: el, clientX: x, clientY: y };
      const touchList =
        typeof win.Touch === "function"
          ? [new win.Touch(touchInit)]
          : ([touchInit] as unknown as Touch[]);

      el.dispatchEvent(
        new win.TouchEvent(type, {
          ...common,
          touches: touchList,
          targetTouches: [],
          changedTouches: touchList,
        }),
      );
    };

    const ptr = (type: string, extra: Record<string, unknown> = {}) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          ...common,
          pointerType: "touch",
          isPrimary: true,
          pointerId: 1,
          clientX: x,
          clientY: y,
          ...extra,
        }),
      );

    const mouse = (type: string) =>
      el.dispatchEvent(
        new MouseEvent(type, {
          ...common,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: 1,
        }),
      );

    touch("touchstart");
    ptr("pointerover");
    ptr("pointerenter");
    ptr("pointerdown", { buttons: 1 });
    mouse("mouseover");
    mouse("mousedown");
    touch("touchend");
    ptr("pointerup");
    mouse("mouseup");
    mouse("click");
  }, handle);
}

test.describe("desktop touch menu activation", () => {
  test("tapping a menu item navigates on desktop touch devices", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1280, height: 900 },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "maxTouchPoints", {
        configurable: true,
        get: () => 1,
      });
    });

    const page = await context.newPage();

    try {
      await page.goto("/menu-test");

      const testbed = page.getByTestId("menu-testbed");
      const header = testbed.getByTestId("menu-testbed-header");

      const trigger = header.getByTestId("nav-top-mark2");
      await expect(trigger).toBeVisible();

      await tapTouch(page, trigger);

      const menu = page.locator(
        '[role="menu"][data-state="open"][data-persona-menu="persona.mark2"]',
      );
      await expect(menu).toBeVisible();

      const menuItem = menu.getByTestId("menu-item-menu.mark2.scrolls").first();
      await menuItem.waitFor({ state: "visible", timeout: 5_000 });
      await page.waitForTimeout(100);
      await tapTouch(page, menuItem);
      await page.waitForURL(/\/menu-test(\/target)?$/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/menu-test\/target$/);
      await expect(page.getByTestId("menu-test-target-heading")).toBeVisible();

      const selectInfo = await page.evaluate(() => {
        const scope = window as unknown as {
          __navTest?: { lastSelect?: Record<string, unknown> };
        };
        return scope.__navTest?.lastSelect ?? null;
      });

      expect(selectInfo).not.toBeNull();
      expect(selectInfo).toMatchObject({
        href: "/menu-test/target",
        prevented: false,
        navigated: true,
      });
    } finally {
      await context.close();
    }
  });
});
