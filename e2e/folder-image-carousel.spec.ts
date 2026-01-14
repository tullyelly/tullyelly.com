import { test, expect } from "./fixtures";

function parseCounter(text: string | null) {
  const match = text?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) {
    return { current: 0, total: 0 };
  }
  return { current: Number(match[1]), total: Number(match[2]) };
}

test("folder image carousel opens, navigates, and closes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/shaolin/avenue-q");

  const thumbnail = page.getByTestId("folder-carousel-thumbnail");
  await expect(thumbnail).toBeVisible();
  await expect(page.getByTestId("folder-carousel-play-overlay")).toBeVisible();

  await thumbnail.click();

  const modal = page.getByTestId("folder-carousel-modal");
  await expect(modal).toBeVisible();

  const counter = page.getByTestId("carousel-counter");
  await expect(counter).toBeVisible();
  const initialText = await counter.textContent();
  const initial = parseCounter(initialText);
  expect(initial.total).toBeGreaterThan(0);

  const nextButton = page.getByTestId("carousel-next");
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(counter).not.toHaveText(initialText ?? "");
  const nextText = await counter.textContent();
  const nextState = parseCounter(nextText);
  expect(nextState.current).toBeGreaterThanOrEqual(initial.current);

  const prevButton = page.getByTestId("carousel-prev");
  await expect(prevButton).toBeEnabled();
  await prevButton.click();
  await expect(counter).toHaveText(initialText ?? "");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("folder-carousel-modal")).toHaveCount(0);
});
