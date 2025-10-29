import { expect, Page } from "@playwright/test";

type NavigateOpts = { allowBypass?: boolean };
type NavResult = { handled: false } | { handled: true; href?: string };

function normalizePath(next: string) {
  try {
    const url = new URL(next, "https://tullyelly.invalid");
    return url.pathname || "/";
  } catch {
    return next.startsWith("/") ? next : `/${next}`;
  }
}

async function clickNavLinkInternal(
  page: Page,
  slug: string,
  opts?: NavigateOpts,
): Promise<NavResult> {
  const nav = page.getByTestId(`e2e-nav-${slug}`);
  const count = await nav.count();
  if (count === 0) {
    return { handled: false as const };
  }

  const link = nav.first();
  const href = (await link.getAttribute("href")) ?? undefined;
  try {
    await link.click();
    return { handled: true as const, href };
  } catch (err) {
    if (!opts?.allowBypass || !href) {
      throw err;
    }
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLAnchorElement | null;
      if (el) el.click();
    }, `[data-testid="e2e-nav-${slug}"]`);
    return { handled: true as const, href };
  }
}

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
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  if ((await nav.count()) > 0) {
    await expect(nav).toBeVisible();
  } else {
    await expect(page.locator("#content-pane")).toBeVisible();
  }
}

export async function navigateToSlug(
  page: Page,
  slug: string,
  opts?: NavigateOpts,
) {
  await dismissAnyDialogIfOpen(page);
  await recoverFromErrorBoundary(page);

  const navResult = await clickNavLinkInternal(page, slug, opts);
  let targetPath = `/${slug}`;

  if (!navResult.handled) {
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
  } else if (navResult.href) {
    targetPath = normalizePath(navResult.href);
  }

  await page.waitForURL((url) => url.pathname.startsWith(targetPath));
}

export async function expectBreadcrumbs(page: Page, expected: RegExp | string) {
  const nav = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(nav).toBeVisible();
  await expect(nav).toContainText(expected);
}

export async function clickNavLink(
  page: Page,
  slug: string,
  opts?: NavigateOpts,
) {
  const navResult = await clickNavLinkInternal(page, slug, opts);
  if (!navResult.handled) {
    throw new Error(`Nav link for slug "${slug}" not found`);
  }
  const targetPath = normalizePath(navResult.href ?? `/${slug}`);
  await page.waitForURL((url) => url.pathname.startsWith(targetPath));
}
