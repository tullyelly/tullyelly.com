import { test, expect } from "./fixtures";

test("release creation controls present when enabled", async ({ page }) => {
  test.skip(
    process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED !== "1",
    "creation disabled",
  );
  await page.goto("/mark2/shaolin-scrolls");
  await expect(
    page.getByRole("button", { name: "Create Patch" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Minor" }),
  ).toBeVisible();
});

test("no hydration warnings on scrolls page", async ({ page }) => {
  await page.goto("/mark2/shaolin-scrolls");
  // fixture will assert no console hydration errors on teardown
  // --- Begin robust container detection for mobi ---
  const table = page.locator("#scrolls-table");
  // Be permissive about card testids; cover likely variants and future renames.
  const cards = page.locator(
    [
      '[data-testid="scrolls-card"]',
      '[data-testid="scroll-card"]',
      '[data-testid^="scroll"][data-testid$="card"]',
    ].join(", "),
  );

  // Let DOM settle after navigation/hydration, but don't mask real warnings.
  await page.waitForLoadState("domcontentloaded");

  const vp = page.viewportSize();
  const isMobi = !vp || vp.width <= 768; // our mobi project uses a small viewport

  // Probe states with short, independent timeboxes.
  const tryVisible = async (loc: typeof table, timeout = 1500) =>
    loc
      .waitFor({ state: "visible", timeout })
      .then(() => true)
      .catch(() => false);

  const tableVisible = await tryVisible(table, 1500);
  let cardVisible = false;
  if (!tableVisible) {
    // If table isn't visible (typical on mobi), try cards.
    cardVisible = await tryVisible(cards.first(), 2000);
  }

  // If neither became visible, check for fallback "hidden table exists" (mobile-expected).
  let tableExistsButHidden = false;
  if (!tableVisible && !cardVisible) {
    const tableCount = await table.count();
    if (tableCount > 0) {
      // Accept hidden as OK on mobi.
      const hiddenOk = await table.isHidden().catch(() => false);
      tableExistsButHidden = isMobi && hiddenOk;
    }
  }

  // Final gate: at least one acceptable UI state must be true.
  if (tableVisible) {
    await expect(table).toBeVisible();
  } else if (cardVisible) {
    await expect(cards.first()).toBeVisible();
  } else if (tableExistsButHidden) {
    // Expected on mobile; nothing further to assert.
    await expect(table).toBeHidden();
  } else {
    const tableCount = await table.count();
    const cardCount = await cards.count();
    const htmlSample = await page
      .locator("main")
      .first()
      .innerHTML()
      .catch(() => "");
    throw new Error(
      `Scrolls UI did not reach an expected state for mobi.
     tableVisible=${tableVisible}, cardVisible=${cardVisible}, tableExistsButHidden=${tableExistsButHidden},
     #scrolls-table count=${tableCount}, [*scroll*card*] count=${cardCount}, vp=${JSON.stringify(vp)}
     main.innerHTML sample (truncated): ${htmlSample.slice(0, 800)}`,
    );
  }
  // --- End robust container detection ---
});
