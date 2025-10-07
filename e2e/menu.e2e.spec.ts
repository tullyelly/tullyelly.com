import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import type { EventName } from "@/lib/analytics";

const desktopViewport = { width: 1366, height: 900 };
const mobileViewport = { width: 390, height: 844 };

test.describe.skip("menu navigation analytics (quarantine)", () => {
  async function getEvents(
    page: import("@playwright/test").Page,
  ): Promise<Array<{ name: EventName; props: Record<string, unknown> }>> {
    return page.evaluate(() => {
      const api = (window as any).__analytics;
      if (!api || typeof api.get !== "function") return [];
      return api.get();
    });
  }

  async function flushEvents(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      const api = (window as any).__analytics;
      if (api && typeof api.flush === "function") {
        api.flush();
      }
    });
  }

  async function waitForEvent(
    page: import("@playwright/test").Page,
    name: EventName,
    predicate?: (props: Record<string, unknown>) => boolean,
  ) {
    await expect
      .poll(
        async () => {
          const events = await getEvents(page);
          return events.find((event) => {
            if (event.name !== name) return false;
            return predicate ? predicate(event.props ?? {}) : true;
          });
        },
        { message: `Waiting for analytics event ${name}` },
      )
      .toBeTruthy();
  }

  async function expectNoSeriousViolations(
    page: import("@playwright/test").Page,
    selector: string,
  ) {
    const axe = await new AxeBuilder({ page }).include(selector).analyze();
    const serious = axe.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(serious).toEqual([]);
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ path: "public/test-init.js" });
  });

  async function preparePage(
    page: import("@playwright/test").Page,
    viewport: { width: number; height: number },
  ) {
    await page.setViewportSize(viewport);
    await page.goto("/menu-test");
    await page.waitForFunction(
      () => typeof (window as any).__analytics !== "undefined",
    );
    await page.waitForSelector(
      '[data-testid="nav-desktop"], [data-testid="nav-mobile"]',
    );
    await flushEvents(page);
  }

  test("desktop navigation emits analytics and passes axe", async ({
    page,
  }) => {
    await preparePage(page, desktopViewport);

    const trigger = page.getByTestId("persona-trigger-persona.mark2");
    await expect(trigger).toBeVisible();
    await trigger.dispatchEvent("pointerenter");
    await trigger.dispatchEvent("mouseenter");
    const menu = page.locator('[data-persona-menu="persona.mark2"]');
    await expect(menu).toHaveAttribute("data-state", "open");
    await expect(
      page.getByTestId("menu-item-menu.mark2.scrolls"),
    ).toBeVisible();

    await expectNoSeriousViolations(page, '[data-testid="nav-desktop"]');

    await page.getByTestId("menu-item-menu.mark2.scrolls").click();
    await page.waitForURL("**/menu-test/target");
    await expect(page.getByTestId("menu-test-target-heading")).toBeVisible();

    await waitForEvent(page, "menu.desktop.open");
    await waitForEvent(
      page,
      "menu.desktop.click",
      (props) => props.path === "/menu-test/target",
    );
  });

  test("mobile navigation emits analytics and passes axe", async ({ page }) => {
    await preparePage(page, mobileViewport);

    const openButton = page.getByLabel("Open menu");
    await expect(openButton).toBeVisible();
    await openButton.click();
    const drawer = page.getByTestId("nav-mobile-drawer");
    await expect(drawer).toHaveAttribute("data-state", "open");

    await expectNoSeriousViolations(page, '[data-testid="nav-mobile-drawer"]');

    const firstAccordion = drawer
      .locator('[data-testid^="mobile-accordion-"]')
      .first();
    await firstAccordion.click();
    await drawer.locator('[data-testid^="menu-item-"]').first().click();
    await page.waitForURL("**/menu-test/target");
    await expect(page.getByTestId("menu-test-target-heading")).toBeVisible();

    await waitForEvent(
      page,
      "menu.mobile.open",
      (props) => props.state === "open",
    );
    await waitForEvent(
      page,
      "menu.mobile.click",
      (props) => props.path === "/menu-test/target",
    );
  });

  test("command menu emits analytics and passes axe", async ({ page }) => {
    await preparePage(page, desktopViewport);

    const searchButton = page.getByRole("button", { name: /search/i });
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    const cmdk = page.getByTestId("cmdk");
    await expect(cmdk).toBeVisible();

    await expectNoSeriousViolations(page, '[data-testid="cmdk"]');
    await waitForEvent(page, "menu.cmdk.open");

    await page.keyboard.type("scrolls");
    await waitForEvent(
      page,
      "menu.cmdk.search",
      (props) => (props.qLen as number) >= 1,
    );
    await page.getByTestId("menu-item-menu.mark2.scrolls").first().click();
    await page.waitForURL("**/menu-test/target");
    await expect(page.getByTestId("menu-test-target-heading")).toBeVisible();

    await waitForEvent(
      page,
      "menu.cmdk.select",
      (props) => props.path === "/menu-test/target",
    );
  });
});
