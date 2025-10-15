import { expect, test } from "@playwright/test";
import { ensureReady, navigateToSlug, expectBreadcrumbs } from "./utils/ui";

test("breadcrumbs update live on client-side navigation", async ({ page }) => {
  await page.goto("/");
  await ensureReady(page);

  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toHaveCount(0);

  await navigateToSlug(page, "mark2");
  await expectBreadcrumbs(page, /home\s*\/\s*mark2/i);

  await navigateToSlug(page, "cardattack");
  await expectBreadcrumbs(page, /home\s*\/\s*cardattack/i);
});
