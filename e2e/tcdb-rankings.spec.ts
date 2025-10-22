import { test, expect } from "./fixtures";

test("ranking detail trigger is interactable and opens dialog", async ({
  page,
}) => {
  await page.goto("/cardattack/tcdb-rankings");
  const row = page.getByTestId("tcdb-table-row").first();
  await expect(row).toBeVisible();

  const trigger = row.getByTestId("ranking-detail-trigger");
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();

  const hasCursorPointer = await trigger.evaluate((el) =>
    el.className.includes("cursor-pointer"),
  );
  expect(hasCursorPointer).toBeTruthy();

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const { width: modalWidth, ratioAttr } = await dialog.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const ratioAttr = el.getAttribute("data-modal-width-ratio");
    return { width: rect.width, ratioAttr };
  });

  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("viewport size unavailable");
  }
  const viewportWidth = viewport.width;

  const expectedRatio = ratioAttr ? Number.parseFloat(ratioAttr) : 0.4;
  const widthDelta = Math.abs(modalWidth - viewportWidth * expectedRatio);
  expect(widthDelta).toBeLessThanOrEqual(24);

  const actualRatio = modalWidth / viewportWidth;
  expect(actualRatio).toBeGreaterThan(0.34);
  expect(actualRatio).toBeLessThan(0.46);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("ranking detail dialog basic interactions still work", async ({
  page,
}) => {
  await page.goto("/cardattack/tcdb-rankings");
  const row = page.getByTestId("tcdb-table-row").first();
  await expect(row).toBeVisible();
  const trigger = row.getByTestId("ranking-detail-trigger");
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeVisible();

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("[data-testid='modal-overlay']")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
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
