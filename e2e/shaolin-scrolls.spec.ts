import { test, expect } from "./fixtures";

test("desktop release link navigates to a standalone detail page", async ({
  page,
}) => {
  test.skip(
    test.info().project.name === "mobi",
    "Desktop table is hidden in the mobile layout.",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByRole("columnheader", { name: "ID" })).toBeVisible();
  const firstLink = page.locator("tbody tr").first().locator("a").first();
  const href = await firstLink.getAttribute("href");
  await firstLink.click();
  await expect(page).toHaveURL(href ?? /\/mark2\/shaolin-scrolls\/\d+$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Back to Shaolin Scrolls" }),
  ).toBeVisible();
  await expect(page.getByTestId("release-activity")).toBeVisible();
});

test("mobile renders release cards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByTestId("release-card").first()).toBeVisible();
});

test("direct release URL renders the standalone detail page", async ({
  page,
}) => {
  await page.goto("/mark2/shaolin-scrolls/33");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Back to Shaolin Scrolls" }),
  ).toBeVisible();
  await expect(page.getByText("Activity begins")).toBeVisible();
  await expect(page.getByText("Activity ends")).toBeVisible();
});

test("invalid release ID uses the not-found page", async ({ page }) => {
  const response = await page.goto("/mark2/shaolin-scrolls/999999999");
  expect(response?.status()).toBe(404);
});

test("modified click keeps native link behavior", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/mark2/shaolin-scrolls");
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  const firstLink = page.locator("tbody tr").first().locator("a").first();
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    firstLink.click({ modifiers: [modifier] }),
  ]);
  await newPage.waitForLoadState("domcontentloaded");
  await expect(newPage).toHaveURL(/\/mark2\/shaolin-scrolls\/\d+$/);
  await newPage.close();
});
