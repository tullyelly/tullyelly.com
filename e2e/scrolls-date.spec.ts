import { test, expect } from "./fixtures";

test.use({ timezoneId: "America/Chicago" });

test("release dates render the correct Central calendar day", async ({
  page,
}) => {
  await page.goto("/shaolin-scrolls");
  const releaseDateCell = page.getByTestId("release-date").first();
  const iso = await releaseDateCell.getAttribute("data-release-iso");
  if (iso) {
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
  const expectedText = iso
    ? (() => {
        const [year, month, day] = iso.split("-").map(Number);
        const safeDate = new Date(Date.UTC(year, month - 1, day, 12));
        return new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Chicago",
          year: "numeric",
          month: "short",
          day: "2-digit",
        }).format(safeDate);
      })()
    : "";
  await expect(releaseDateCell).toHaveText(expectedText);
});
