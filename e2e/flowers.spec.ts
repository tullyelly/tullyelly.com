import { test, expect } from "@playwright/test";

test("credits page renders Flowers heading and aria-labeled element", async ({
  page,
}) => {
  await page.goto("/credits");
  await expect(
    page.getByRole("heading", { level: 1, name: /Flowers/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Acknowledgments" }),
  ).toBeVisible();
});

test("home page shows Flowers inline notes for sections", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByLabel("Acknowledgments").filter({ hasText: "Chronicles wiki" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Acknowledgments").filter({
      hasText: "PostgreSQL, Neon & DataGrip; rekindled my database crush.",
    }),
  ).toBeVisible();
});

test("mark2 shaolin scrolls page omits Flowers inline notes", async ({
  page,
}) => {
  await page.goto("/mark2/shaolin-scrolls");
  await expect(page.getByLabel("Acknowledgments")).toHaveCount(0);
});
