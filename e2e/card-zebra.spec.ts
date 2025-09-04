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

test('roadwork rappin albums screenshot', async ({ page }) => {
  await page.goto('/roadwork-rappin');
  const grid = page.locator('[data-zebra]').first();
  await grid.evaluate((el) => {
    Object.assign(el.style, { width: '64px', height: '64px', overflow: 'hidden' });
  });
  const screenshot = await grid.screenshot();
  const base64 = screenshot.toString('base64');
  expect(base64).toMatchSnapshot('roadwork-rappin-zebra.txt');
});
