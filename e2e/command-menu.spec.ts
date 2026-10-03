import { test, expect } from "@playwright/test";

test("search focus follows its mounting and dismissal lifecycle", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Desktop command menu uses the Chromium project.",
  );
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Blocked aria-hidden"))
      warnings.push(message.text());
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Log.enable");
  cdp.on("Log.entryAdded", ({ entry }) => {
    if (entry.text.includes("Blocked aria-hidden")) warnings.push(entry.text);
  });
  await page.goto("/");
  const trigger = page.getByTestId("nav-desktop-search");
  const palette = page.getByTestId("cmdk");
  const input = page.getByRole("combobox");
  await expect(palette).toHaveCount(0);
  await trigger.focus();
  await expect(trigger).toBeFocused();

  const mac = await page.evaluate(() =>
    /Mac|iPhone|iPad/i.test(navigator.platform),
  );
  for (const close of ["Escape", "shortcut", "outside", "result"]) {
    if (close === "shortcut") {
      await page.keyboard.press(mac ? "Meta+k" : "Control+k");
    } else {
      await trigger.click();
    }
    await expect(input).toBeFocused();
    await expect(page.getByRole("dialog")).not.toHaveAttribute(
      "aria-modal",
      "true",
    );
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(input).toBeFocused();
    if (close === "outside") {
      await page.mouse.click(5, 5);
    } else if (close === "result") {
      await input.fill("accessibility lifecycle query");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/search\?q=accessibility/);
    } else {
      // The shortcut modifier follows the platform, matching the provider.
      await page.keyboard.press(
        close === "Escape" ? close : mac ? "Meta+k" : "Control+k",
      );
    }
    await expect(palette).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }

  await page.keyboard.press(mac ? "Meta+k" : "Control+k");
  await expect(input).toBeFocused();
  // A non-modal header link can navigate while search is open.
  await page.locator("header a[href='/']").first().click();
  await expect(palette).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.isConnected)).toBe(
    true,
  );
  await trigger.focus();
  await page.keyboard.press(mac ? "Meta+k" : "Control+k");
  await expect(input).toBeFocused();
  await trigger.evaluate((node) => node.remove());
  await page.keyboard.press("Escape");
  await expect(palette).toHaveCount(0);
  await expect(page.getByRole("main")).toBeFocused();
  expect(warnings).toEqual([]);
});
