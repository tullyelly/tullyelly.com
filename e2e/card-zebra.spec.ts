import { test, expect } from './fixtures';

test('card backgrounds alternate in zebra container', async ({ page }) => {
  await page.goto('/ui-lab');
  const cards = page.locator('[data-testid="zebra-demo"] > [data-card]');
  await expect(cards).toHaveCount(4);
  const { surface1, surface2 } = await page.evaluate(() => {
    const a = document.createElement('div');
    a.style.background = 'var(--surface-1)';
    document.body.appendChild(a);
    const b = document.createElement('div');
    b.style.background = 'var(--surface-2)';
    document.body.appendChild(b);
    const colors = {
      surface1: getComputedStyle(a).backgroundColor,
      surface2: getComputedStyle(b).backgroundColor,
    };
    a.remove();
    b.remove();
    return colors;
  });
  const colors = await cards.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el as HTMLElement).backgroundColor)
  );
  expect(colors).toEqual([surface1, surface2, surface1, surface2]);
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
