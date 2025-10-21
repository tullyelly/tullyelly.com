import { test, expect } from "./fixtures";

test("ranking detail trigger shows pointer cursor and is keyboard accessible", async ({
  page,
}) => {
  await page.goto("/cardattack/tcdb-rankings");
  const trigger = page
    .getByRole("button", { name: /view tcdb details/i })
    .first();

  await trigger.hover();
  const cursor = await trigger.evaluate(
    (node) => getComputedStyle(node).cursor,
  );
  expect(cursor).toBe("pointer");

  let focused = false;
  for (let i = 0; i < 30; i++) {
    const isActive = await trigger.evaluate(
      (node) => node === document.activeElement,
    );
    if (isActive) {
      focused = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(focused).toBeTruthy();

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("ranking detail dialog locks background and focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cardattack/tcdb-rankings");
  const trigger = page
    .getByRole("button", { name: /view tcdb details/i })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
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
  const width1280 = await dialog.evaluate(
    (node) => node.getBoundingClientRect().width,
  );
  const expected1280 = 1280 * 0.86;
  expect(Math.abs(width1280 - expected1280)).toBeLessThanOrEqual(3);
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
  await page.setViewportSize({ width: 360, height: 780 });
  const narrowOverflow = await modalBody.evaluate(
    (node) => node.scrollWidth > node.clientWidth,
  );
  expect(narrowOverflow).toBeFalsy();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator("#page-root")).not.toHaveAttribute("inert", "");
});

test.describe("TCDB rankings snapshot dialog", () => {
  test.skip(
    true,
    "Auth helpers for tcdb snapshot creation are not wired for Playwright yet.",
  );

  test("allowed user can create snapshot and see updated table", async ({
    page,
  }) => {
    await page.goto("/cardattack/tcdb-rankings");

    await page.getByRole("button", { name: "Add Snapshot" }).click();

    await page.getByLabel("Homie").fill("Test Homie");
    await page.getByRole("option", { name: "Test Homie" }).first().click();

    await page.getByLabel("Card count").fill("1");
    await page.getByLabel("Ranking").fill("1");
    await page.getByLabel("Difference").fill("0");
    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel("Ranking date").fill(today);

    await page.getByRole("button", { name: "Save Snapshot" }).click();

    await expect(page.getByText("Snapshot added")).toBeVisible();
  });

  test("forbidden user does not see add snapshot button", async ({ page }) => {
    await page.goto("/cardattack/tcdb-rankings");
    await expect(
      page.getByRole("button", { name: "Add Snapshot" }),
    ).toHaveCount(0);
  });
});
