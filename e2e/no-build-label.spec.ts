import { test, expect } from './fixtures';

test('no Build label anywhere', async ({ page }) => {
  await page.goto('/shaolin-scrolls');
  const matches = await page.locator('text=Build:').count();
  expect(matches).toBe(0);
});

