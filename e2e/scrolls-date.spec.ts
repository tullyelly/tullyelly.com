import { test, expect } from "./fixtures";

test.use({ timezoneId: "America/Chicago" });

test("release dates render the correct Central calendar day", async ({
  page,
}) => {
  await page.goto("/shaolin-scrolls");
  const releaseDateCell = page.getByTestId("release-date").first();
  const iso = await releaseDateCell.getAttribute("data-release-iso");
  const expectedText = iso
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(iso))
    : "";
  await expect(releaseDateCell).toHaveText(expectedText);
});
