import { test, expect } from './fixtures';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim();
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

test('card backgrounds alternate in zebra container', async ({ page }) => {
  await page.goto('/ui-lab');
  const cards = page.locator('[data-testid="zebra-demo"] > [data-card]');
  await expect(cards).toHaveCount(4);
  const surface1 = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue('--surface-1').trim()
  );
  const surface2 = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim()
  );
  const colors = await cards.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el as HTMLElement).backgroundColor)
  );
  expect(colors[0]).toBe(hexToRgb(surface1));
  expect(colors[1]).toBe(hexToRgb(surface2));
  expect(colors[2]).toBe(hexToRgb(surface1));
  expect(colors[3]).toBe(hexToRgb(surface2));
});

test('roadwork rappin albums screenshot', async ({ page }) => {
  await page.goto('/roadwork-rappin');
  const grid = page.locator('[data-zebra]').first();
  const screenshot = await grid.screenshot();
  const base64 = screenshot.toString('base64');
  expect(base64).toMatchSnapshot('roadwork-rappin-zebra.txt');
});
