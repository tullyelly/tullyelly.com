import { test, expect } from './fixtures';

test('card backgrounds alternate in zebra container', async ({ page }) => {
  await page.goto('/ui-lab');
  const cards = page.locator('[data-testid="zebra-demo"] > [data-card]');
  await expect(cards).toHaveCount(4);
  const colors = await cards.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el as HTMLElement).backgroundColor)
  );
  expect(colors[0]).toBe(colors[2]);
  expect(colors[1]).toBe(colors[3]);
  expect(colors[0]).not.toBe(colors[1]);
});
