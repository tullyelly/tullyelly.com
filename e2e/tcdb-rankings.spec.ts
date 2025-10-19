import { test, expect } from "./fixtures";

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
