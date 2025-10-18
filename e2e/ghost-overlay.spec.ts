import { test, expect } from "@playwright/test";

test.describe("ghost overlay safeguards", () => {
  test("closed overlays release pointer events", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => {
      const scope = window as typeof window & {
        __navTest?: { openCmdk?: () => void };
      };
      return typeof scope.__navTest?.openCmdk === "function";
    });
    await page.evaluate(() => {
      const scope = window as typeof window & {
        __navTest?: { openCmdk?: () => void };
      };
      scope.__navTest?.openCmdk?.();
    });
    const palette = page.getByTestId("cmdk");
    await expect(palette).toBeVisible();
    await expect(palette).toHaveAttribute("data-state", "open");
    await page.keyboard.press("Escape");
    await expect(palette).toHaveAttribute("data-state", "closed");
    await expect(palette).toBeHidden();

    const pointerEvents = await page.evaluate(() => {
      const roots = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-overlay-root][data-state='closed']",
        ),
      );
      return roots.map((node) => window.getComputedStyle(node).pointerEvents);
    });

    expect(pointerEvents.length).toBeGreaterThan(0);
    for (const value of pointerEvents) {
      expect(value).toBe("none");
    }

    const overlayHitsUpperLeft = await page.evaluate(() => {
      const target = document.elementFromPoint(12, 12);
      if (!target) return false;
      return (
        target.hasAttribute("data-overlay-root") ||
        target.hasAttribute("data-overlay-layer")
      );
    });
    expect(overlayHitsUpperLeft).toBe(false);
  });

  test("upper-left clicks and scroll operate normally", async ({ page }) => {
    await page.goto("/");
    const point = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return null;
      const rect = main.getBoundingClientRect();
      return {
        x: Math.round(rect.left + Math.min(rect.width / 4, 80)),
        y: Math.round(rect.top + Math.min(rect.height / 4, 80)),
      };
    });

    expect(point).not.toBeNull();
    const { x, y } = point!;

    const beforeUrl = page.url();
    await page.mouse.move(x, y);
    await page.mouse.click(x, y, { delay: 15 });
    await page.waitForTimeout(50);
    expect(page.url()).toBe(beforeUrl);

    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(60);
    const afterScroll = await page.evaluate(() => window.scrollY);
    expect(afterScroll).toBeGreaterThanOrEqual(beforeScroll);
  });
});
