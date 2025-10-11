import { test, expect } from "./fixtures";

// Desktop table view
test("desktop table opens dialog on ID click", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByRole("columnheader", { name: "ID" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Release Date" }),
  ).toBeVisible();
  const firstLink = page.locator("tbody tr").first().locator("a").first();
  const idText = (await firstLink.textContent())?.trim() ?? "";
  await firstLink.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(idText);
  await expect(page).toHaveURL("/mark2/shaolin-scrolls");
});

// Mobile cards view
test("mobile renders cards only", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByTestId("release-card").first()).toBeVisible();
});

test("navigate back from details", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/mark2/shaolin-scrolls");
  const firstLink = page.locator("tbody tr").first().locator("a").first();
  const idText = (await firstLink.textContent())?.trim();
  await page.goto(`/mark2/shaolin-scrolls/${idText}`);
  await expect(page.getByRole("link", { name: "Back to list" })).toBeVisible();
  await page.getByRole("link", { name: "Back to list" }).click();
  await expect(page).toHaveURL("/mark2/shaolin-scrolls");
});
