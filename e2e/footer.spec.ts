import { test, expect } from "./fixtures";

test("footer is deterministic and at bottom on short pages", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(footer).toContainText("© ");

  // Ensure sticky layout (footer follows content, not fixed)
  const isFixed = await footer.evaluate((el) => {
    const style = window.getComputedStyle(el as HTMLElement);
    return style.position === "fixed";
  });
  expect(isFixed).toBeFalsy();

  // No stray Build labels anywhere
  await expect(page.locator("text=Build:")).toHaveCount(0);
});
