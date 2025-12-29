import { test, expect } from "./fixtures";
import { withinRatio } from "./utils/layout";

// Desktop table view
test("desktop table opens dialog on ID click", async ({ page }) => {
  test.skip(
    test.info().project.name === "mobi",
    "Desktop-only layout width expectations do not apply to mobi.",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await expect(page.locator("[data-testid='modal-overlay']")).toBeVisible();
  await expect(page.locator("#page-root")).toHaveAttribute("inert", "");
  const bodyOverflow = await page.evaluate(
    () => getComputedStyle(document.body).overflow,
  );
  expect(bodyOverflow).toBe("hidden");
  const overlayFilter = await page
    .locator("[data-testid='modal-overlay']")
    .evaluate((node) => getComputedStyle(node).backdropFilter || "");
  expect(overlayFilter.includes("blur")).toBeFalsy();
  const wideWidth = await dialog.evaluate(
    (node) => node.getBoundingClientRect().width,
  );
  expect(wideWidth).toBeLessThanOrEqual(900);
  await page.setViewportSize({ width: 1280, height: 900 });
  const vpWidth = 1280;
  const width1280 = await dialog.evaluate(
    (node) => node.getBoundingClientRect().width,
  );
  // Keep desktop dialog between 40-60% of the viewport so minor design tweaks stay within guardrails.
  const expectedDesktop = Math.min(vpWidth * 0.8, 640);
  expect.soft(Math.abs(width1280 - expectedDesktop)).toBeLessThanOrEqual(24);
  expect(withinRatio(width1280, vpWidth, 0.4, 0.6)).toBe(true);
  const modalZ = await dialog.evaluate((node) => {
    const value = Number.parseInt(getComputedStyle(node).zIndex, 10);
    return Number.isNaN(value) ? 0 : value;
  });
  const breadcrumbZ = await page.getByTestId("breadcrumb").evaluate((node) => {
    const value = Number.parseInt(getComputedStyle(node).zIndex, 10);
    return Number.isNaN(value) ? 0 : value;
  });
  expect(modalZ).toBeGreaterThan(breadcrumbZ);
  const modalOverflowX = await dialog.evaluate(
    (node) => getComputedStyle(node).overflowX,
  );
  expect(modalOverflowX).toBe("hidden");
  const modalBody = page.getByTestId("modal-body");
  await expect(modalBody).toBeVisible();
  const bodyOverflowX = await modalBody.evaluate(
    (node) => getComputedStyle(node).overflowX,
  );
  expect(bodyOverflowX).toBe("hidden");
  const hasHorizontalOverflow = await modalBody.evaluate(
    (node) => node.scrollWidth > node.clientWidth,
  );
  expect(hasHorizontalOverflow).toBeFalsy();
  await page.setViewportSize({ width: 390, height: 780 });
  const narrowViewport = page.viewportSize()?.width ?? 390;
  const narrowWidth = await dialog.evaluate(
    (node) => node.getBoundingClientRect().width,
  );
  const expectedNarrow = Math.min(narrowViewport * 0.8, 640);
  expect(Math.abs(narrowWidth - expectedNarrow)).toBeLessThanOrEqual(24);
  const overflowDelta = await modalBody.evaluate((node) =>
    Math.max(0, node.scrollWidth - node.clientWidth),
  );
  expect(overflowDelta).toBeLessThanOrEqual(32);
  await expect(page).toHaveURL("/mark2/shaolin-scrolls");
});

// Mobile cards view
test("mobile renders cards only", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByTestId("release-card").first()).toBeVisible();
});

test("deep link opens dialog for scroll 33", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/mark2/shaolin-scrolls/33");
  await expect(
    page.getByRole("heading", { name: "Shaolin Scrolls" }),
  ).toBeVisible();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Scroll 33");
});

test("closing deep-linked dialog returns to list URL", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/mark2/shaolin-scrolls/33");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page).toHaveURL("/mark2/shaolin-scrolls");
  await expect(dialog).toHaveCount(0);
});

test("meta/ctrl click opens scroll ID in new tab", async ({ page }) => {
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
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await newPage.close();
});
