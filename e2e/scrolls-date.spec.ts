import { test, expect } from "./fixtures";

test.use({ timezoneId: "America/Chicago" });

test("release dates render the correct Central calendar day", async ({
  page,
}) => {
  await page.goto("/shaolin-scrolls");
  const releaseDateCell = page.locator("tbody tr").first().locator("td").nth(4);
  await expect(releaseDateCell).toHaveText("Sep 19, 2025");
});
