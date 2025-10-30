import { test } from "./fixtures";
import { expect } from "@playwright/test";

async function waitForRankingsList(page: import("@playwright/test").Page) {
  // Wait for either table or a card-like container to attach; don't assume specific testids on mobi
  await page
    .waitForSelector(
      '[data-testid="tcdb-table"], [data-testid="tcdb-cards"], [data-testid="tcdb-table-row"]',
      { state: "attached" },
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function getFirstVisibleTrigger(page: import("@playwright/test").Page) {
  // The trigger testid is the same for row and card versions; select the first visible one
  const trigger = page
    .locator('[data-testid="ranking-detail-trigger"]:visible')
    .first();
  await expect(
    trigger,
    "Expected a visible ranking-detail-trigger in either layout",
  ).toBeVisible();
  await trigger.scrollIntoViewIfNeeded().catch(() => {});
  return trigger;
}

test("ranking detail trigger is interactable and opens dialog", async ({
  page,
}) => {
  await page.goto("/cardattack/tcdb-rankings");
  await waitForRankingsList(page);
  const trigger = await getFirstVisibleTrigger(page);

  const hasCursorPointer = await trigger.evaluate((el) =>
    el.className.includes("cursor-pointer"),
  );
  expect(hasCursorPointer).toBeTruthy();

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const { width: modalWidth } = await dialog.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width };
  });

  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("viewport size unavailable");
  }
  const viewportWidth = viewport.width;

  const expectedWidth = Math.min(viewportWidth * 0.8, 640);
  const widthDelta = Math.abs(modalWidth - expectedWidth);
  expect(widthDelta).toBeLessThanOrEqual(32);

  const actualRatio = modalWidth / viewportWidth;
  expect(actualRatio).toBeGreaterThan(0.35);
  expect(actualRatio).toBeLessThanOrEqual(0.8);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("ranking detail dialog basic interactions still work", async ({
  page,
}) => {
  await page.goto("/cardattack/tcdb-rankings");
  await waitForRankingsList(page);
  const trigger = await getFirstVisibleTrigger(page);
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
