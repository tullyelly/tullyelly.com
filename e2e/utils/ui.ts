import { expect, Page } from "@playwright/test";

export async function dismissAnyDialogIfOpen(page: Page) {
  const dialog = page.locator('[role="dialog"]');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const visible = await dialog.isVisible().catch(() => false);
    if (!visible) return;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  }
}

export async function recoverFromErrorBoundary(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const retry = page.getByRole("button", { name: "Retry" });
    const visible = await retry.isVisible().catch(() => false);
    if (!visible) return;
    await retry.click();
    await page.waitForLoadState("networkidle");
  }
}

export async function ensureReady(page: Page) {
  await dismissAnyDialogIfOpen(page);
  await recoverFromErrorBoundary(page);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toBeVisible();
}

export async function navigateToSlug(page: Page, slug: string) {
  await dismissAnyDialogIfOpen(page);
  await recoverFromErrorBoundary(page);

  const e2eLink = page.getByTestId(`e2e-nav-${slug}`);
  if ((await e2eLink.count()) > 0) {
    await e2eLink.first().click();
  } else {
    const top = page.getByTestId(`nav-top-${slug}`);
    if ((await top.count()) > 0) {
      const trigger = top.first();
      const tagName = await trigger.evaluate((el) => el.tagName.toLowerCase());
      await trigger.click();
      if (tagName !== "a") {
        const overview = page.getByTestId(`nav-menu-${slug}-overview`);
        await expect(overview.first()).toBeVisible();
        await overview.first().click();
      }
    } else {
      await page.goto(`/${slug}`);
    }
  }

  await page.waitForURL((url) => url.pathname.startsWith(`/${slug}`));
}

export async function expectBreadcrumbs(page: Page, expected: RegExp | string) {
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav).toBeVisible();
  await expect(nav).toContainText(expected);
}
