import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("homie directory supports instant filtering and detail links", async ({
  page,
}) => {
  await page.goto("/cardattack/homies");
  await expect(page.getByRole("heading", { name: "Homies" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unlock Editing" }),
  ).toHaveCount(0);

  const links = page.locator('[data-testid="ranking-detail-trigger"]:visible');
  const first = links.first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute("href");
  expect(href).toMatch(/^\/cardattack\/homies\/(?:[a-z0-9-]+|\d+)$/);

  const initialCount = await links.count();
  await page
    .getByRole("searchbox", { name: "Search homies" })
    .fill(`directory-no-match-${Date.now()}`);
  await expect(links).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Search homies" }).clear();
  await expect(links).toHaveCount(initialCount);

  await first.click();
  await expect(page).toHaveURL(/\/cardattack\/homies\/[a-z0-9-]+$/);
});

test("legacy rankings route is absent and does not redirect", async ({
  page,
}) => {
  const response = await page.goto("/cardattack/tcdb-rankings");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL("/cardattack/tcdb-rankings");
});

test.describe("snapshot creation", () => {
  test.skip(
    true,
    "Auth helpers for snapshot creation are not wired for Playwright yet.",
  );

  test("authorized user can add a snapshot", async ({ page }) => {
    await page.goto("/cardattack/homies");
    await page.getByRole("button", { name: "Add Snapshot" }).click();
  });
});
